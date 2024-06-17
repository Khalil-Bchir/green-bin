import { defineStore } from 'pinia';

export const usePredictionStore = defineStore({
  id: 'prediction',
  state: () => ({
    prediction: ''
  }),
  actions: {
    setPrediction(prediction: string) {
      this.prediction = prediction;
    }
  }
});
