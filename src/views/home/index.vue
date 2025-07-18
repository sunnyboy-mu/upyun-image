<template>
  <div class="upload-container">
    <div
      class="upload-area"
      :class="{ dragover: isDragover }"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <input
        type="file"
        ref="fileInput"
        class="hidden-input"
        accept="image/*"
        multiple
        @change="handleFileInput"
      />
      <div class="upload-content">
        <div class="upload-icon">📤</div>
        <h2>拖拽图片到此或点击上传</h2>
        <p>支持JPEG, PNG格式</p>
      </div>
    </div>

    <div class="preview-grid" v-if="uploadedFiles.length">
      <div
        class="preview-item"
        v-for="(file, index) in uploadedFiles"
        :key="file.name + index"
      >
        <img
          :src="file.preview"
          :alt="file.name"
          class="preview-image"
          @click="copyImageUrl(file.preview)"
        />
        <button class="delete-btn" @click="removeImage(index)">×</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

interface UploadedFile {
  name: string;
  preview: string;
  file: File;
}

const isDragover = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const uploadedFiles = ref<UploadedFile[]>([]);

const handleDragOver = () => {
  isDragover.value = true;
};

const handleDragLeave = () => {
  isDragover.value = false;
};

const handleDrop = (e: DragEvent) => {
  isDragover.value = false;
  if (e.dataTransfer?.files) {
    processFiles(e.dataTransfer.files);
  }
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileInput = (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (input.files?.length) {
    processFiles(input.files);
  }
};

const checkAuthCode = () => {
  let authCode = localStorage.getItem("auth_code");
  if (!authCode) {
    authCode = prompt("请输入授权码(auth_code):");
    if (authCode) {
      localStorage.setItem("auth_code", btoa(authCode));
      return true;
    }
    return false;
  }
  return true;
};

const processFiles = (files: FileList) => {
  if (!checkAuthCode()) {
    alert("需要授权码才能上传文件");
    return;
  }

  Array.from(files).forEach((file) => {
    const formData = new FormData();

    formData.append("file", file);

    fetch("/api/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_code")}`,
      },
      body: formData,
    })
      .then((r) => r.json())
      .then((data) => {
        uploadedFiles.value.push({
          name: file.name,
          preview: data.data,
          file: file,
        });
      });
  });
};

const copyImageUrl = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url);
  } catch (err) {
    console.error("复制失败:", err);
  }
};

const handlePaste = async (event: Event) => {
  if (!checkAuthCode()) {
    alert("需要授权码才能上传文件");
    return;
  }

  const clipboardEvent = event as ClipboardEvent;
  const items = clipboardEvent.clipboardData?.items;
  if (!items) return;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const blob = item.getAsFile();
      if (blob) {
        const extension = blob.type.split("/")[1] || "png";
        const file = new File(
          [blob],
          `pasted-image-${Date.now()}.${extension}`,
          { type: blob.type }
        );
        processFiles(new FileListWrapper([file]));
      }
    }
  }
};

// 辅助类，将File数组包装成FileList
class FileListWrapper implements FileList {
  constructor(private files: File[]) {}
  get length(): number {
    return this.files.length;
  }
  item(index: number): File | null {
    return this.files[index] || null;
  }
  *[Symbol.iterator](): IterableIterator<File> {
    yield* this.files;
  }
  [index: number]: File;
}

onMounted(() => {
  window.addEventListener("paste", handlePaste);
});

onUnmounted(() => {
  window.removeEventListener("paste", handlePaste);
});

const removeImage = (index: number) => {
  uploadedFiles.value.splice(index, 1);
};
</script>

<style scoped>
.upload-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  background-image: linear-gradient(45deg, #f0f8ff 25%, transparent 25%),
    linear-gradient(-45deg, #f0f8ff 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #f0f8ff 75%),
    linear-gradient(-45deg, transparent 75%, #f0f8ff 75%);
  background-size: 20px 20px;
}

.upload-area {
  border: 3px dashed #90cdf4;
  border-radius: 15px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.5);
}

.upload-area.dragover {
  border-color: #3182ce;
  background: rgba(144, 205, 244, 0.1);
  transform: scale(1.02);
}

.upload-content {
  color: #2b6cb0;
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.hidden-input {
  display: none;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
}

.preview-item {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.preview-item:hover {
  transform: translateY(-5px);
}

.preview-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
  display: block;
}

.delete-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: #f56565;
  color: white;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.delete-btn:hover {
  opacity: 1;
}

h2 {
  margin: 0.5rem 0;
  color: #2b6cb0;
}

p {
  margin: 0;
  color: #718096;
}
</style>
