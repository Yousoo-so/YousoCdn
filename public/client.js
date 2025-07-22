document.addEventListener('DOMContentLoaded', () => {
   const dropZone = document.getElementById('drop-zone');
   const browseBtn = document.getElementById('browse-btn');
   const fileInput = document.getElementById('file-input');
   const fileListContainer = document.getElementById('file-list-container');
   const fileList = document.getElementById('file-list');

   const MAX_FILE_SIZE = 100 * 1024 * 1024;
   browseBtn.addEventListener('click', () => fileInput.click());
   fileInput.addEventListener('change', () => handleFiles(fileInput.files));
   dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drop-zone-active'); });
   dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drop-zone-active'));
   dropZone.addEventListener('drop', (e) => {
       e.preventDefault();
       dropZone.classList.remove('drop-zone-active');
       handleFiles(e.dataTransfer.files);
   });
   const handleFiles = (files) => {
       fileListContainer.classList.remove('hidden');
       [...files].forEach(file => {
           const fileId = `file-${Date.now()}-${Math.random()}`;
           const fileElement = createFileElement(file, fileId);
           fileList.appendChild(fileElement);

           if (file.size > MAX_FILE_SIZE) {
               updateFileStatus(fileElement, 'Gagal: Ukuran > 100MB', 'error');
           } else {
               uploadFile(file, fileElement);
           }
       });
       fileInput.value = '';
   };
   const createFileElement = (file, fileId) => {
       const fileElement = document.createElement('div');
       fileElement.id = fileId;
       fileElement.className = 'flex items-center justify-between bg-gray-700/50 p-3 rounded-md mb-2';
       
       fileElement.innerHTML = `
           <div class="flex items-center overflow-hidden mr-2">
               <i class="fas fa-file-alt text-gray-400 text-xl"></i>
               <div class="ml-3 truncate">
                   <p class="font-semibold text-white text-sm truncate" title="${file.name}">${file.name}</p>
                   <p class="text-xs text-gray-400">${formatBytes(file.size)}</p>
               </div>
           </div>
           <div class="status-area w-2/5 text-right">
               <p class="status-text text-xs font-semibold text-blue-400">Menunggu...</p>
               <div class="w-full bg-gray-600 rounded-full h-1.5 mt-1">
                   <div class="progress-bar bg-blue-500 h-1.5 rounded-full transition-width duration-300" style="width: 0%"></div>
               </div>
           </div>
       `;
       return fileElement;
   };
   const showUrlResult = (fileElement, url) => {
       const statusArea = fileElement.querySelector('.status-area');
       statusArea.innerHTML = `
           <div class="flex items-center">
               <input type="text" readonly value="${url}" class="url-input text-xs bg-gray-800 text-gray-300 border border-gray-600 rounded-l-md p-1 w-full focus:outline-none">
               <button class="copy-btn bg-red-600 hover:bg-red-700 text-white p-1 rounded-r-md" title="Salin URL">
                   <i class="fas fa-copy"></i>
               </button>
           </div>
       `;
       const copyBtn = statusArea.querySelector('.copy-btn');
       copyBtn.addEventListener('click', () => {
           const urlInput = statusArea.querySelector('.url-input');
           urlInput.select();
           document.execCommand('copy');
           copyBtn.innerHTML = '<i class="fas fa-check"></i>';
           copyBtn.classList.remove('bg-red-600');
           copyBtn.classList.add('bg-green-500');
           setTimeout(() => {
               copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
               copyBtn.classList.remove('bg-green-500');
               copyBtn.classList.add('bg-red-600');
           }, 2000);
       });
   };
   const updateFileStatus = (fileElement, text, type) => {
       const statusText = fileElement.querySelector('.status-text');
       const progressBar = fileElement.querySelector('.progress-bar');
       if (!statusText || !progressBar) return;

       statusText.textContent = text;
       statusText.className = 'status-text text-xs font-semibold';
       progressBar.className = 'progress-bar h-1.5 rounded-full transition-width duration-300';
       
       switch (type) {
           case 'uploading':
               statusText.classList.add('text-red-500');
               progressBar.classList.add('bg-red-600');
               break;
           case 'error':
               statusText.classList.add('text-yellow-400');
               progressBar.classList.add('bg-yellow-500');
               progressBar.style.width = '100%';
               break;
           default:
               statusText.classList.add('text-blue-400');
               progressBar.classList.add('bg-blue-500');
       }
   };
   const uploadFile = (file, fileElement) => {
       const formData = new FormData();
       formData.append('file', file);

       const xhr = new XMLHttpRequest();
       const progressBar = fileElement.querySelector('.progress-bar');
       
       xhr.upload.addEventListener('progress', (e) => {
           if (e.lengthComputable) {
               const percentComplete = (e.loaded / e.total) * 100;
               progressBar.style.width = percentComplete + '%';
               updateFileStatus(fileElement, `Mengunggah... ${Math.round(percentComplete)}%`, 'uploading');
           }
       });

       xhr.addEventListener('load', () => {
           if (xhr.status === 200) {
               const response = JSON.parse(xhr.responseText);
               showUrlResult(fileElement, response.url);
           } else {
               const response = JSON.parse(xhr.responseText);
               updateFileStatus(fileElement, `Gagal: ${response.message || 'Error Server'}`, 'error');
           }
       });

       xhr.addEventListener('error', () => {
            updateFileStatus(fileElement, 'Gagal: Masalah jaringan', 'error');
       });

       xhr.open('POST', '/upload', true);
       xhr.send(formData);
   };
   const formatBytes = (bytes, decimals = 2) => {
       if (bytes === 0) return '0 Bytes';
       const k = 1024;
       const dm = decimals < 0 ? 0 : decimals;
       const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
       const i = Math.floor(Math.log(bytes) / Math.log(k));
       return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
   };
});
