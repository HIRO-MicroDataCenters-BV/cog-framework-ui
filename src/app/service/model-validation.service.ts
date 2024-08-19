import { Injectable } from '@angular/core';
import { ValidationArtifactsData } from '../model/ValidationArtifacts';

@Injectable({
  providedIn: 'root',
})
export class ModelValidationService {
  modelValidationArtifactsData: ValidationArtifactsData | undefined;
  previousComponentUrl: string | undefined;
  previousComponentUrlQuery: string | undefined;

  constructor() {}
}
