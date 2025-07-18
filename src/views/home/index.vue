<template>
  <div class="simple-upload">
    <div
      class="dropzone"
      :class="{ dragover: isDragover }"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <input
        type="file"
        ref="fileInput"
        class="file-input"
        accept="image/*"
        multiple
        @change="handleFileInput"
      />
      <div class="dropzone-content">
        <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
          <path stroke="#888" stroke-width="1.5" d="M12 16V4m0 0-4 4m4-4 4 4" />
          <rect
            width="20"
            height="12"
            x="2"
            y="8"
            stroke="#888"
            stroke-width="1.5"
            rx="3"
          />
        </svg>
        <div class="dropzone-text">拖拽图片或点击上传</div>
        <div class="dropzone-sub">支持 JPEG/PNG，粘贴图片也可上传</div>
      </div>
    </div>

    <div class="preview-list" v-if="uploadedFiles.length">
      <div
        class="preview-row"
        v-for="(file, index) in uploadedFiles"
        :key="file.name + index"
      >
        <div class="preview-img-wrapper">
          <img :src="file.preview" :alt="file.name" class="preview-img" />
        </div>
        <div class="preview-url">
          <div class="file-name" :title="file.name">{{ file.name }}</div>
          <div class="url-copy-row">
            <div class="url-text">{{ file.preview }}</div>
            <button
              class="el-copy-btn"
              @click="copyImageUrl(file.preview, index)"
              :title="copiedIndex === index ? '已复制' : '复制链接'"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="9" width="13" height="13" rx="2" fill="white" />
                <rect x="2" y="2" width="13" height="13" rx="2" fill="white" />
                <rect
                  x="9"
                  y="9"
                  width="13"
                  height="13"
                  rx="2"
                  stroke="white"
                  stroke-width="1.5"
                />
                <rect
                  x="2"
                  y="2"
                  width="13"
                  height="13"
                  rx="2"
                  stroke="white"
                  stroke-width="1.5"
                />
                <path d="M7 7h5v5H7z" fill="#409EFF" />
              </svg>
            </button>
            <span v-if="copiedIndex === index" class="copied-tip">已复制</span>
          </div>
        </div>
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
const copiedIndex = ref<number | null>(null);
let copyTimeout: number | null = null;

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
        if (data.code !== 200) {
          localStorage.removeItem("auth_code");
          alert("授权码已过期，请重新输入");
          return;
        }
        uploadedFiles.value.push({
          name: file.name,
          preview: data.data,
          file: file,
        });
      });
  });
};

const copyImageUrl = async (url: string, index: number) => {
  try {
    await navigator.clipboard.writeText(url);
    copiedIndex.value = index;
    if (copyTimeout) clearTimeout(copyTimeout);
    copyTimeout = window.setTimeout(() => {
      copiedIndex.value = null;
    }, 1200);
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

// 删除操作已移除
</script>

<style scoped>
.simple-upload {
  max-width: 80%;
  margin: 56px auto;
  padding: 40px 32px 32px 32px;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 2px 16px rgba(64, 158, 255, 0.06);
}

.dropzone {
  border: 2.5px dashed #c0c4cc;
  border-radius: 16px;
  padding: 64px 0 56px 0;
  min-height: 180px;
  text-align: center;
  background: #f2f6fc;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.dropzone.dragover {
  border-color: #409eff;
  background: #ecf5ff;
}
.file-input {
  display: none;
}
.dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.dropzone-text {
  font-size: 1.25rem;
  color: #303133;
  margin-top: 12px;
  margin-bottom: 2px;
}
.dropzone-sub {
  font-size: 1.05rem;
  color: #909399;
}

.preview-list {
  display: flex;
  flex-direction: column;
  gap: 22px;
  margin-top: 40px;
}
.preview-row {
  display: flex;
  align-items: center;
  gap: 24px;
  background: #f2f6fc;
  border-radius: 12px;
  box-shadow: 0 1px 6px rgba(64, 158, 255, 0.07);
  padding: 12px 18px;
}
.preview-img-wrapper {
  position: relative;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.preview-img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(64, 158, 255, 0.04);
}
.preview-url {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.file-name {
  font-size: 0.98rem;
  color: #606266;
  font-weight: 500;
  text-align: left;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.url-copy-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}
.url-text {
  font-size: 0.97rem;
  color: #409eff;
  word-break: break-all;
  background: #ecf5ff;
  border-radius: 6px;
  padding: 4px 8px;
}
.el-copy-btn {
  background: none;
  border: none;
  border-radius: 6px;
  padding: 4px 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background 0.18s;
  box-shadow: none;
}
.el-copy-btn svg {
  display: block;
}
.el-copy-btn svg rect,
.el-copy-btn svg path {
  stroke: #409eff;
}
.el-copy-btn svg path[fill] {
  fill: #409eff;
}
.el-copy-btn:hover {
  background: #ecf5ff;
}
.copied-tip {
  color: #67c23a;
  font-size: 0.95rem;
  margin-left: 4px;
}
</style>
