<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>EcoTrack</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" class="ion-padding ion-text-center">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">EcoTrack</ion-title>
        </ion-toolbar>
      </ion-header>
      <ExploreContainer name="EcoTrack page" />
      <div class="camera-button-container">
        <ion-button @click="takePhoto">
          <ion-icon :icon="camera"></ion-icon>
        </ion-button>
      </div>
      <div v-if="prediction" class="prediction-container">
        <p>Prediction: {{ prediction }}</p>
      </div>
      <div v-if="debugInfo" class="debug-container">
        <p>{{ debugInfo }}</p>
      </div>
      <div class="credits-container">
        <p>Credits: {{ credits }}</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonContent,
  IonButton,
  IonIcon,
  IonPage,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { camera } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ref, onMounted, watch } from 'vue';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { AiModel } from '@/stores/AiModel';

export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
}

const prediction = ref<string | null>(null);
const debugInfo = ref<string | null>(null); // New ref for debug information
const credits = ref<number>(0); // New ref for credits

const photos = ref<UserPhoto[]>([]);
const PHOTO_STORAGE = 'photos';

const cachePhotos = () => {
  Preferences.set({
    key: PHOTO_STORAGE,
    value: JSON.stringify(photos.value),
  });
};

watch(photos, cachePhotos);

const loadSaved = async () => {
  const photoList = await Preferences.get({ key: PHOTO_STORAGE });
  const photosInPreferences = photoList.value ? JSON.parse(photoList.value) : [];

  for (const photo of photosInPreferences) {
    const file = await Filesystem.readFile({
      path: photo.filepath,
      directory: Directory.Data,
    });
    photo.webviewPath = `data:image/jpeg;base64,${file.data}`;
  }

  photos.value = photosInPreferences;
};

onMounted(loadSaved);

const takePhoto = async () => {
  try {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      quality: 100,
    });

    if (photo.base64String) {

      const savedFile = await Filesystem.writeFile({
        path: `${new Date().getTime()}.jpeg`,
        data: photo.base64String,
        directory: Directory.Data,
      });

      const newPhoto: UserPhoto = {
        filepath: savedFile.uri,
        webviewPath: photo.webPath,
      };
      photos.value = [newPhoto, ...photos.value];

      // Convert base64 to blob
      const byteCharacters = atob(photo.base64String);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      // Convert blob to file
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('image', file);


      // Send the file to the API
      const result = await AiModel.predict(formData);

      if (result && result.predicted_class) {
        prediction.value = result.predicted_class;

        if (result.predicted_class !== 'Prediction is not clear') {
          credits.value += 1; // Increase credits if prediction is successful
        }
      } else if (result && result.message) {
        prediction.value = result.message;
      } else {
        prediction.value = 'Prediction failed';
        debugInfo.value = 'API did not return a predicted class or message';
      }

    } else {
      debugInfo.value = 'No base64 string found in photo object';
    }
  } catch (error) {
    debugInfo.value = 'Error taking photo: ' + (error as Error).message;
  }
};

</script>

<style scoped>
.camera-button-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.prediction-container {
  margin-top: 20px;
}
.debug-container {
  margin-top: 20px;
  color: red;
}
.credits-container {  /* New styles for the credits container */
  margin-top: 20px;
  font-size: 18px;
  color: green;
}
</style>
