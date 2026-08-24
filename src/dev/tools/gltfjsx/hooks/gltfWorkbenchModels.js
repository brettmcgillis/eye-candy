import { useCallback, useEffect, useMemo, useState } from 'react';

import { modelFile } from '@utils/appUtils';

const MODELS_ENDPOINT = '/dev-api/gltfjsx/models';

export function labelForModelValue(value, uploadedAsset) {
  if (value === 'uploaded') {
    const fileName = uploadedAsset?.primaryFilePath?.split('/').pop();
    return fileName || 'Current upload';
  }

  if (value.startsWith('saved:')) {
    return value.slice('saved:'.length).split('/').pop();
  }

  return 'model';
}

export function modelSourceFromValue(value, uploadedAsset) {
  if (value === 'uploaded') {
    return uploadedAsset || null;
  }

  if (value.startsWith('saved:')) {
    const assetPath = value.slice('saved:'.length);
    return {
      type: 'saved',
      assetPath,
      url: modelFile(assetPath),
    };
  }

  return null;
}

export function useWorkbenchModelList() {
  const [modelList, setModelList] = useState([]);
  const [modelListError, setModelListError] = useState(null);

  const refreshModelList = useCallback(async () => {
    try {
      const response = await fetch(MODELS_ENDPOINT);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'Could not list models.');
      }

      setModelList(payload.models || []);
      setModelListError(null);
    } catch (error) {
      setModelListError(
        error instanceof Error ? error.message : 'Could not list models.'
      );
    }
  }, []);

  useEffect(() => {
    refreshModelList();
  }, [refreshModelList]);

  return {
    modelList,
    modelListError,
    refreshModelList,
  };
}

export function useWorkbenchModelOptions(uploadedAsset, placeholderLabel) {
  const { modelList, modelListError, refreshModelList } =
    useWorkbenchModelList();

  const modelOptions = useMemo(() => {
    const options = [];

    if (placeholderLabel) {
      options.push({ label: placeholderLabel, value: '' });
    }

    if (uploadedAsset) {
      options.push({ label: 'Current upload', value: 'uploaded' });
    }

    modelList.forEach((model) => {
      options.push({
        label: model.assetPath,
        value: `saved:${model.assetPath}`,
      });
    });

    return options;
  }, [modelList, placeholderLabel, uploadedAsset]);

  return {
    modelList,
    modelListError,
    modelOptions,
    refreshModelList,
  };
}
