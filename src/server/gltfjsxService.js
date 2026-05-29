import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import * as prettier from 'prettier';

const MAX_REQUEST_BYTES = 250 * 1024 * 1024;
const MODEL_ROOT_RELATIVE = path.join('public', 'models');
const COMPONENT_ROOT_RELATIVE = path.join('src', 'components', 'elements');
const ENTRY_EXTENSIONS = new Set(['.glb', '.gltf']);

export class RequestError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.name = 'RequestError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function quoteForShell(value) {
  if (/^[A-Za-z0-9_./:@-]+$/.test(value)) return value;
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function ensureInside(rootPath, targetPath, label) {
  const relative = path.relative(rootPath, targetPath);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new RequestError(
      400,
      'INVALID_PATH',
      `${label} resolves outside the allowed workspace root.`
    );
  }
}

function sanitizeModelSlug(value) {
  const candidate = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return candidate || 'model';
}

function sanitizeAssetBaseName(value, fallback = 'model') {
  const candidate = String(value || '')
    .trim()
    .replace(/\.[A-Za-z0-9]+$/u, '')
    .replace(/[^A-Za-z0-9._-]+/gu, '-')
    .replace(/^-+|-+$/gu, '');

  return candidate || fallback;
}

function toPascalCase(value) {
  const parts = String(value || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);

  const result = parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  const fallback = result || 'Model';
  return /^[A-Za-z_$]/.test(fallback) ? fallback : `Model${fallback}`;
}

function normalizeUploadPath(filePath) {
  const normalized = String(filePath || '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');
  const safePath = path.posix.normalize(normalized);

  if (!safePath || safePath === '.' || safePath.startsWith('../')) {
    throw new RequestError(
      400,
      'INVALID_FILE_PATH',
      'Uploaded file path is invalid.',
      {
        filePath,
      }
    );
  }

  return safePath;
}

function getBinaryPath(rootDir) {
  return path.join(
    rootDir,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'gltfjsx.cmd' : 'gltfjsx'
  );
}

function getRepoModelFileImport(componentDir, rootDir) {
  const importTarget = path.resolve(rootDir, 'src/utils/appUtils');
  const relativePath = toPosix(path.relative(componentDir, importTarget));
  return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
}

function mapOptions(rawOptions = {}) {
  const verbose = Boolean(rawOptions.verbose);

  return {
    bones: Boolean(rawOptions.bones),
    debug: Boolean(rawOptions.debug),
    degrade: String(rawOptions.degrade || '').trim(),
    degraderesolution: Number(rawOptions.degraderesolution || 512),
    draco: String(rawOptions.draco || '').trim(),
    error: Number(rawOptions.error || 0.001),
    exportdefault: Boolean(rawOptions.exportdefault),
    format: String(rawOptions.format || 'webp').trim() || 'webp',
    instance: Boolean(rawOptions.instance),
    instanceall: Boolean(rawOptions.instanceall),
    keepgroups: verbose || Boolean(rawOptions.keepgroups),
    keepmaterials: Boolean(rawOptions.keepmaterials),
    keepmeshes: Boolean(rawOptions.keepmeshes),
    keepnames: verbose || Boolean(rawOptions.keepnames),
    meta: Boolean(rawOptions.meta),
    precision: Number(rawOptions.precision || 3),
    printwidth: Number(rawOptions.printwidth || 120),
    ratio: Number(rawOptions.ratio || 0.75),
    resolution: Number(rawOptions.resolution || 1024),
    shadows: Boolean(rawOptions.shadows),
    simplify: Boolean(rawOptions.simplify),
    transform: Boolean(rawOptions.transform),
    types: Boolean(rawOptions.types),
    verbose,
  };
}

function buildCliFlags(options) {
  const flags = [];

  if (options.types) flags.push('--types');
  if (options.keepnames) flags.push('--keepnames');
  if (options.keepgroups) flags.push('--keepgroups');
  if (options.bones) flags.push('--bones');
  if (options.meta) flags.push('--meta');
  if (options.shadows) flags.push('--shadows');
  if (options.instance) flags.push('--instance');
  if (options.instanceall) flags.push('--instanceall');
  if (options.exportdefault) flags.push('--exportdefault');
  if (options.debug) flags.push('--debug');

  flags.push('--printwidth', String(options.printwidth));
  flags.push('--precision', String(options.precision));

  if (options.draco) {
    flags.push('--draco', options.draco);
  }

  if (options.transform) {
    flags.push('--transform');
  }

  if (options.transform || options.instance || options.instanceall) {
    flags.push('--resolution', String(options.resolution));
    flags.push('--format', options.format);

    if (options.keepmeshes) flags.push('--keepmeshes');
    if (options.keepmaterials) flags.push('--keepmaterials');
    if (options.simplify) {
      flags.push('--simplify');
      flags.push('--ratio', String(options.ratio));
      flags.push('--error', String(options.error));
    }
    if (options.degrade) {
      flags.push('--degrade', options.degrade);
      flags.push('--degraderesolution', String(options.degraderesolution));
    }
  }

  return flags;
}

function buildCliCommandString({ inputPath, outputPath, rootPath, options }) {
  const parts = [
    'npx',
    'gltfjsx',
    quoteForShell(toPosix(inputPath)),
    '--output',
    quoteForShell(toPosix(outputPath)),
    '--root',
    quoteForShell(toPosix(rootPath)),
  ];

  buildCliFlags(options).forEach((flag) => {
    parts.push(typeof flag === 'string' ? quoteForShell(flag) : String(flag));
  });

  return parts.join(' ');
}

async function runCommand(binaryPath, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(binaryPath, args, {
      cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ code, stderr, stdout });
        return;
      }

      reject(
        new RequestError(
          500,
          'GLTFJSX_FAILED',
          stderr.trim() || stdout.trim() || 'gltfjsx conversion failed.',
          {
            exitCode: code,
            stderr: stderr.trim() || null,
            stdout: stdout.trim() || null,
          }
        )
      );
    });
  });
}

function extractAssetPath(code) {
  const match = code.match(/useGLTF\('([^']+)'/);

  if (!match) {
    throw new RequestError(
      500,
      'INVALID_GENERATED_CODE',
      'Could not determine the generated asset path from gltfjsx output.'
    );
  }

  return match[1];
}

async function formatComponent(code, filePath) {
  const resolvedConfig = (await prettier.resolveConfig(filePath)) ?? {};
  return prettier.format(code, {
    ...resolvedConfig,
    filepath: filePath,
  });
}

async function collectFilesRecursive(rootDir, baseDir = rootDir) {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });

  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(rootDir, entry.name);

      if (entry.isDirectory()) {
        return collectFilesRecursive(absolutePath, baseDir);
      }

      if (!entry.isFile()) {
        return [];
      }

      return [
        {
          absolutePath,
          relativePath: toPosix(path.relative(baseDir, absolutePath)),
        },
      ];
    })
  );

  return nestedFiles.flat();
}

function normalizeGeneratedComponent({
  assetPath,
  code,
  commandString,
  componentDir,
  componentName,
  rootDir,
  stageRoot,
}) {
  const modelImportPath = getRepoModelFileImport(componentDir, rootDir);
  const assetLiteral = `'${assetPath}'`;
  const assetExpression = `modelFile('${assetPath}')`;
  const normalizedStageRoot = toPosix(stageRoot);
  const normalizedRootDir = toPosix(rootDir);

  let nextCode = code
    .split(normalizedStageRoot)
    .join(normalizedRootDir)
    .replace(/Command: .*/g, `Command: ${commandString}`)
    .split(assetLiteral)
    .join(assetExpression)
    .replace(
      /export default function Model\b/,
      `export default function ${componentName}`
    )
    .replace(/export function Model\b/, `export function ${componentName}`);

  nextCode = nextCode.replace(
    /import React from 'react';?\n/,
    `import React from 'react';\nimport { modelFile } from '${modelImportPath}';\n`
  );

  if (nextCode.includes('._')) {
    nextCode = `/* eslint-disable no-underscore-dangle */\n${nextCode}`;
  }

  return nextCode;
}

function decodeFileBuffer(base64, fileName) {
  try {
    return Buffer.from(base64, 'base64');
  } catch {
    throw new RequestError(
      400,
      'INVALID_FILE_DATA',
      'Uploaded file could not be decoded.',
      {
        fileName,
      }
    );
  }
}

async function stageFiles({
  assetDirectoryMode,
  files,
  modelFolderName,
  primaryFilePath,
  primaryOutputBaseName,
  renamePrimaryFile,
  stageModelsRoot,
}) {
  const normalizedFiles = files.map((file) => {
    const relativePath = normalizeUploadPath(file.relativePath || file.name);

    if (typeof file.base64 !== 'string' || !file.base64.length) {
      throw new RequestError(
        400,
        'INVALID_FILE_DATA',
        'Uploaded file is missing binary data.',
        {
          filePath: relativePath,
        }
      );
    }

    return {
      base64: file.base64,
      name: String(file.name || path.posix.basename(relativePath)),
      relativePath,
    };
  });

  const normalizedPrimary = primaryFilePath
    ? normalizeUploadPath(primaryFilePath)
    : normalizedFiles.find((file) =>
        ENTRY_EXTENSIONS.has(path.extname(file.relativePath).toLowerCase())
      )?.relativePath;

  if (!normalizedPrimary) {
    throw new RequestError(
      400,
      'MISSING_PRIMARY_FILE',
      'Choose a primary .glb or .gltf file before converting.'
    );
  }

  const primaryFile = normalizedFiles.find(
    (file) => file.relativePath === normalizedPrimary
  );

  if (!primaryFile) {
    throw new RequestError(
      400,
      'MISSING_PRIMARY_FILE',
      'The selected primary file was not uploaded.',
      {
        primaryFilePath: normalizedPrimary,
      }
    );
  }

  const primaryExtension = path.extname(primaryFile.relativePath).toLowerCase();
  if (!ENTRY_EXTENSIONS.has(primaryExtension)) {
    throw new RequestError(
      400,
      'UNSUPPORTED_PRIMARY_FILE',
      'The primary file must be a .glb or .gltf asset.'
    );
  }

  const assetRelativeDirectory =
    assetDirectoryMode === 'folder' ? modelFolderName : '';
  const primaryDirectory = path.posix.dirname(primaryFile.relativePath);
  const primaryFileName = renamePrimaryFile
    ? `${primaryOutputBaseName}${primaryExtension}`
    : path.posix.basename(primaryFile.relativePath);
  const primaryLocalRelativePath = path.posix.join(
    primaryDirectory === '.' ? '' : primaryDirectory,
    primaryFileName
  );
  const primaryTargetRelativePath = assetRelativeDirectory
    ? path.posix.join(assetRelativeDirectory, primaryLocalRelativePath)
    : primaryLocalRelativePath;

  const seenTargets = new Set();
  const targetFiles = normalizedFiles.map((file) => {
    let targetRelativePath = file.relativePath;

    if (file.relativePath === normalizedPrimary) {
      targetRelativePath = primaryTargetRelativePath;
    } else if (assetRelativeDirectory) {
      targetRelativePath = path.posix.join(
        assetRelativeDirectory,
        file.relativePath
      );
    }

    if (seenTargets.has(targetRelativePath)) {
      throw new RequestError(
        400,
        'DUPLICATE_TARGET_FILE',
        'Two uploaded files resolve to the same destination path.',
        {
          targetRelativePath,
        }
      );
    }

    seenTargets.add(targetRelativePath);

    return {
      ...file,
      targetRelativePath,
    };
  });

  const savedFiles = await Promise.all(
    targetFiles.map(async (file) => {
      const targetAbsolutePath = path.resolve(
        stageModelsRoot,
        file.targetRelativePath
      );
      ensureInside(stageModelsRoot, targetAbsolutePath, 'Staged model file');

      await fs.mkdir(path.dirname(targetAbsolutePath), { recursive: true });
      await fs.writeFile(
        targetAbsolutePath,
        decodeFileBuffer(file.base64, file.name)
      );

      return {
        absolutePath: targetAbsolutePath,
        relativePath: file.targetRelativePath,
        sourcePath: file.relativePath,
      };
    })
  );

  const primaryEntry = savedFiles.find(
    (file) => file.relativePath === primaryTargetRelativePath
  );

  return {
    files: savedFiles,
    primaryAbsolutePath: primaryEntry.absolutePath,
    primaryRelativePath: primaryEntry.relativePath,
  };
}

export async function getGltfJsxCapabilities(rootDir) {
  const binaryPath = getBinaryPath(path.resolve(rootDir));
  const hasBinary = await pathExists(binaryPath);

  return {
    ok: true,
    implementation: hasBinary ? 'local-cli' : 'missing-binary',
    localOnly: true,
    routes: {
      capabilities: '/dev-api/gltfjsx/capabilities',
      convert: '/dev-api/gltfjsx/convert',
    },
    writes: {
      models: 'public/models/ or public/models/<folder>/',
      components: 'src/components/elements/<ModelName>/',
    },
    features: {
      preview: true,
      upload: true,
      convert: hasBinary,
      transform: hasBinary,
    },
    dependencies: {
      gltfjsxBinary: hasBinary,
      prettier: true,
    },
    limits: {
      maxRequestBytes: MAX_REQUEST_BYTES,
    },
  };
}

export async function readJsonBody(req, limitBytes = MAX_REQUEST_BYTES) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;
    let failed = false;

    req.on('data', (chunk) => {
      if (failed) return;

      totalBytes += chunk.length;
      if (totalBytes > limitBytes) {
        failed = true;
        reject(
          new RequestError(
            413,
            'PAYLOAD_TOO_LARGE',
            'Upload payload exceeds the current size limit.',
            {
              limitBytes,
            }
          )
        );
        return;
      }

      chunks.push(chunk);
    });

    req.on('end', () => {
      if (failed) return;

      try {
        const rawBody = Buffer.concat(chunks).toString('utf8');
        resolve(rawBody ? JSON.parse(rawBody) : {});
      } catch (error) {
        reject(
          new RequestError(
            400,
            'INVALID_JSON',
            'Request body must be valid JSON.',
            {
              message: error instanceof Error ? error.message : null,
            }
          )
        );
      }
    });

    req.on('error', (error) => {
      if (failed) return;
      reject(
        new RequestError(
          400,
          'REQUEST_STREAM_ERROR',
          'Failed to read the upload request.',
          {
            message: error instanceof Error ? error.message : null,
          }
        )
      );
    });
  });
}

export async function convertGltfJsxRequest({ payload, rootDir }) {
  const resolvedRootDir = path.resolve(rootDir);
  const binaryPath = getBinaryPath(resolvedRootDir);

  if (!(await pathExists(binaryPath))) {
    throw new RequestError(
      500,
      'MISSING_GLTFJSX',
      'The local gltfjsx binary is not installed in this repo.'
    );
  }

  const options = mapOptions(payload.options);
  const assetDirectoryMode =
    payload.assetDirectoryMode === 'root' ? 'root' : 'folder';
  const modelFolderName = sanitizeModelSlug(
    payload.modelSlug || payload.modelFolderName || payload.modelName
  );
  const componentName = toPascalCase(
    payload.componentName || payload.modelSlug
  );
  const renamePrimaryFile = payload.renamePrimaryFile !== false;
  const primaryOutputBaseName = sanitizeAssetBaseName(
    payload.primaryOutputName || modelFolderName,
    modelFolderName
  );
  const overwrite = Boolean(payload.overwrite);
  const componentExtension = options.types ? 'tsx' : 'jsx';

  if (!Array.isArray(payload.files) || payload.files.length === 0) {
    throw new RequestError(
      400,
      'MISSING_FILES',
      'Drop at least one .glb or .gltf asset before converting.'
    );
  }

  const finalModelsRoot = path.resolve(resolvedRootDir, MODEL_ROOT_RELATIVE);
  const finalComponentsRoot = path.resolve(
    resolvedRootDir,
    COMPONENT_ROOT_RELATIVE
  );
  const finalModelDir =
    assetDirectoryMode === 'folder'
      ? path.resolve(finalModelsRoot, modelFolderName)
      : finalModelsRoot;
  const finalComponentDir = path.resolve(finalComponentsRoot, componentName);
  const finalComponentPath = path.join(
    finalComponentDir,
    `${componentName}.${componentExtension}`
  );

  ensureInside(finalModelsRoot, finalModelDir, 'Final model directory');
  ensureInside(
    finalComponentsRoot,
    finalComponentDir,
    'Final component directory'
  );

  if (!overwrite) {
    if (assetDirectoryMode === 'folder' && (await pathExists(finalModelDir))) {
      throw new RequestError(
        409,
        'MODEL_EXISTS',
        'A model folder with this name already exists. Enable overwrite to replace it.',
        {
          modelFolderName,
        }
      );
    }

    if (await pathExists(finalComponentDir)) {
      throw new RequestError(
        409,
        'COMPONENT_EXISTS',
        'A generated component with this name already exists. Enable overwrite to replace it.',
        {
          componentName,
        }
      );
    }
  }

  const stageRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), 'eye-candy-gltfjsx-')
  );
  const stageModelsRoot = path.join(stageRoot, MODEL_ROOT_RELATIVE);
  const stageModelDir =
    assetDirectoryMode === 'folder'
      ? path.join(stageModelsRoot, modelFolderName)
      : stageModelsRoot;
  const tempOutputPath = path.join(
    stageModelDir,
    `__${componentName}.generated.${componentExtension}`
  );

  try {
    await fs.mkdir(stageModelDir, { recursive: true });

    const staged = await stageFiles({
      assetDirectoryMode,
      files: payload.files,
      modelFolderName,
      primaryFilePath: payload.primaryFilePath,
      primaryOutputBaseName,
      renamePrimaryFile,
      stageModelsRoot,
    });

    const repoRelativeInputPath = path.join(
      MODEL_ROOT_RELATIVE,
      staged.primaryRelativePath
    );
    const repoRelativeTempOutputPath = path.join(
      MODEL_ROOT_RELATIVE,
      toPosix(path.relative(stageModelsRoot, tempOutputPath))
    );

    const commandString = buildCliCommandString({
      inputPath: repoRelativeInputPath,
      options,
      outputPath: repoRelativeTempOutputPath,
      rootPath: MODEL_ROOT_RELATIVE,
    });

    const commandArgs = [
      staged.primaryAbsolutePath,
      '--output',
      tempOutputPath,
      '--root',
      stageModelsRoot,
      ...buildCliFlags(options),
    ];

    const execution = await runCommand(
      binaryPath,
      commandArgs,
      resolvedRootDir
    );
    const generatedCode = await fs.readFile(tempOutputPath, 'utf8');
    const assetPath = extractAssetPath(generatedCode);
    const stagedAssetFiles = (
      await collectFilesRecursive(stageModelsRoot)
    ).filter((file) => file.absolutePath !== tempOutputPath);

    if (!overwrite && assetDirectoryMode === 'root') {
      const existingAssetFile = (
        await Promise.all(
          stagedAssetFiles.map(async (file) => {
            const finalAssetPath = path.resolve(
              finalModelsRoot,
              file.relativePath
            );
            ensureInside(finalModelsRoot, finalAssetPath, 'Final model file');

            if (!(await pathExists(finalAssetPath))) {
              return null;
            }

            return toPosix(path.relative(resolvedRootDir, finalAssetPath));
          })
        )
      ).find(Boolean);

      if (existingAssetFile) {
        throw new RequestError(
          409,
          'MODEL_FILE_EXISTS',
          'A file already exists at the requested public/models path. Enable overwrite to replace it.',
          {
            outputPath: existingAssetFile,
          }
        );
      }
    }

    const normalizedCode = normalizeGeneratedComponent({
      assetPath,
      code: generatedCode,
      commandString,
      componentDir: finalComponentDir,
      componentName,
      rootDir: resolvedRootDir,
      stageRoot,
    });
    const formattedCode = await formatComponent(
      normalizedCode,
      finalComponentPath
    );

    await fs.rm(tempOutputPath, { force: true });

    if (overwrite) {
      if (assetDirectoryMode === 'folder') {
        await fs.rm(finalModelDir, { force: true, recursive: true });
      } else {
        await Promise.all(
          stagedAssetFiles.map(async (file) => {
            const finalAssetPath = path.resolve(
              finalModelsRoot,
              file.relativePath
            );
            ensureInside(finalModelsRoot, finalAssetPath, 'Final model file');
            await fs.rm(finalAssetPath, { force: true });
          })
        );
      }

      await fs.rm(finalComponentDir, { force: true, recursive: true });
    }

    await fs.mkdir(path.dirname(finalModelDir), { recursive: true });
    await fs.mkdir(finalComponentDir, { recursive: true });
    await Promise.all(
      stagedAssetFiles.map(async (file) => {
        const finalAssetPath = path.resolve(finalModelsRoot, file.relativePath);
        ensureInside(finalModelsRoot, finalAssetPath, 'Final model file');
        await fs.mkdir(path.dirname(finalAssetPath), { recursive: true });
        await fs.copyFile(file.absolutePath, finalAssetPath);
      })
    );
    await fs.writeFile(finalComponentPath, formattedCode, 'utf8');

    return {
      ok: true,
      assetPath,
      code: formattedCode,
      command: commandString,
      component: {
        name: componentName,
        relativePath: toPosix(
          path.relative(resolvedRootDir, finalComponentPath)
        ),
      },
      model: {
        directoryMode: assetDirectoryMode,
        entryFileName: path.posix.basename(staged.primaryRelativePath),
        folderName: assetDirectoryMode === 'folder' ? modelFolderName : null,
        directory: toPosix(path.relative(resolvedRootDir, finalModelDir)),
        entryPath: toPosix(
          path.join(MODEL_ROOT_RELATIVE, staged.primaryRelativePath)
        ),
      },
      options,
      savedFiles: stagedAssetFiles.map((file) => ({
        outputPath: toPosix(path.join(MODEL_ROOT_RELATIVE, file.relativePath)),
        sourcePath:
          staged.files.find(
            (stagedFile) => stagedFile.relativePath === file.relativePath
          )?.sourcePath || 'generated during conversion',
      })),
      stderr: execution.stderr.trim() || null,
      stdout: execution.stdout.trim() || null,
    };
  } finally {
    await fs.rm(stageRoot, { force: true, recursive: true });
  }
}
