// spark-extend.js
import { extend } from '@react-three/fiber';
import {
  SparkRenderer as SparkRendererImpl,
  SplatMesh,
} from '@sparkjsdev/spark';

export const SparkRenderer = extend(SparkRendererImpl);
export const SparkSplatMesh = extend(SplatMesh);
