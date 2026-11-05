import auditPresets from './presetAudit.mjs';

export default async function presetKeys(scene) {
  const report = await auditPresets({ scenes: [scene] });
  const result = report.find((item) => item.scene === scene);
  if (!result || result.error) {
    throw new Error(
      `${scene}: ${result?.error ?? 'No scene preset controls found.'}`
    );
  }
  return new Set(result.rows.flatMap(({ controls }) => Object.keys(controls)));
}
