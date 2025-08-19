// Select DOM elements
const uploadInput = document.getElementById("uploadImage");
const originalPreview = document.getElementById("originalPreview");
const resultPreview = document.getElementById("resultPreview");
const removeBtn = document.getElementById("removeBtn");
const replaceBtn = document.getElementById("replaceBtn");
const bgOptions = document.querySelectorAll(".bg-option");
const downloadBtn = document.getElementById("downloadBtn");
const dropArea = document.getElementById("dropArea");

let uploadedFile = null;     // store uploaded image
let resultImage = null;      // store bg-removed/replaced image
let selectedBackground = ""; // store chosen background

// ✅ Enable download when result is ready
function enableDownload(blobUrl) {
  downloadBtn.disabled = false;
  downloadBtn.onclick = () => {
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = "bg-processed.png"; // filename for download
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
}

// 1. Show preview when user uploads an image
uploadInput.addEventListener("change", () => {
  const file = uploadInput.files[0];
  if (file) {
    uploadedFile = file;
    console.log("📂 File selected:", file.name, file.size, "bytes");

    const reader = new FileReader();
    reader.onload = e => {
      originalPreview.src = e.target.result;
      console.log("👀 Original preview updated");
    };
    reader.readAsDataURL(file);
  }
});

// 2. Remove Background (send to backend)
removeBtn.addEventListener("click", async () => {
  if (!uploadedFile) {
    alert("Please upload an image first!");
    return;
  }

  const formData = new FormData();
  formData.append("image", uploadedFile);

  try {
    console.log("🚀 Sending image to backend for background removal...");
    removeBtn.disabled = true;
    removeBtn.textContent = "Processing...";

    const response = await fetch("http://127.0.0.1:5000/remove-bg", {
      method: "POST",
      body: formData
    });

    console.log("📡 Backend response status:", response.status);

    if (!response.ok) throw new Error("Failed to process image.");

    const blob = await response.blob();
    resultImage = URL.createObjectURL(blob);
    resultPreview.src = resultImage;

    console.log("✅ Background removed, preview updated");

    replaceBtn.disabled = false; 
    enableDownload(resultImage); // ✅ enable download here

  } catch (error) {
    console.error("❌ Error removing background:", error.message);
    alert("Error: " + error.message);
  } finally {
    removeBtn.disabled = false;
    removeBtn.textContent = "Remove Background";
  }
});

// 3. Choose a background option
bgOptions.forEach(bg => {
  bg.addEventListener("click", () => {
    bgOptions.forEach(option => option.classList.remove("border-primary"));
    bg.classList.add("border-primary");
    selectedBackground = bg.src;
    console.log("🎨 Background selected:", selectedBackground);
  });
});

// 4. Apply background replacement
replaceBtn.addEventListener("click", async () => {
  if (!resultImage) {
    alert("Please remove background first!");
    return;
  }
  if (!selectedBackground) {
    alert("Please select a background!");
    return;
  }

  try {
    console.log("🚀 Sending image + background to backend...");
    replaceBtn.disabled = true;
    replaceBtn.textContent = "Applying...";

    const response = await fetch("http://127.0.0.1:5000/replace-bg", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageUrl: resultImage,
        backgroundUrl: selectedBackground
      })
    });

    console.log("📡 Backend response status:", response.status);

    if (!response.ok) throw new Error("Failed to apply background.");

    const blob = await response.blob();
    resultImage = URL.createObjectURL(blob);
    resultPreview.src = resultImage;

    console.log("✅ Background applied successfully");

    enableDownload(resultImage); // ✅ enable download here too

  } catch (error) {
    console.error("❌ Error applying background:", error.message);
    alert("Error: " + error.message);
  } finally {
    replaceBtn.disabled = false;
    replaceBtn.textContent = "Apply Background";
  }
});

// 5. Drag & Drop upload
dropArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropArea.classList.add("border-primary");
});

dropArea.addEventListener("dragleave", () => {
  dropArea.classList.remove("border-primary");
});

dropArea.addEventListener("drop", (e) => {
  e.preventDefault();
  dropArea.classList.remove("border-primary");

  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) {
    uploadedFile = file;
    console.log("📂 File dropped:", file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      originalPreview.src = event.target.result;
      console.log("👀 Original preview updated from drop");
    };
    reader.readAsDataURL(file);
  } else {
    alert("Please drop a valid image file!");
  }
});
