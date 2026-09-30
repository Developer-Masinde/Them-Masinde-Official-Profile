const uploadForm = document.getElementById("uploadForm");
const mediaFile = document.getElementById("mediaFile");
const uploadStatus = document.getElementById("uploadStatus");

uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = mediaFile.files[0];

  if (!file) {
    uploadStatus.textContent = "Please choose a file.";
    return;
  }


  // Store every file in the bucket root
  const filePath = `${Date.now()}_${file.name}`;

  uploadStatus.textContent = "Uploading...";

  const { error } = await supabaseClient.storage
    .from("church-media")
    .upload(filePath, file);

  if (error) {
    console.log(error);
    console.log(JSON.stringify(error, null, 2));
    alert(JSON.stringify(error, null, 2));
    uploadStatus.textContent = error.message;
    return;
  }
  //  Refresh after upload
  uploadStatus.textContent = "✅ Upload successful!";
  uploadForm.reset();
  loadMedia();
};);

    
// Displaying all uploaded files.
// Allowing them to be deleted.
// Refreshing the gallery automatically after an upload.

async function loadMedia() {
  const mediaList = document.getElementById("mediaList");
  mediaList.innerHTML = "Loading...";

  const { data, error } = await supabaseClient.storage
    .from("church-media")
    .list("", {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });

  if (error) {
    mediaList.innerHTML = "Failed to load media.";
    console.error(error);
    return;
  }

  mediaList.innerHTML = "";

  for (const item of data) {
    if (item.id === null) continue;

    const { data: urlData } = supabaseClient.storage
      .from("church-media")
      .getPublicUrl(item.name);

    const url = urlData.publicUrl;

    const card = document.createElement("div");
    card.className = "media-card";

    if (item.metadata?.mimetype?.startsWith("image")) {
      card.innerHTML = `
                <img src="${url}">
                <br><br>
                <button onclick="deleteMedia('${item.name}')">
                    Delete
                </button>
            `;
    } else {
      card.innerHTML = `
                <video controls>
                    <source src="${url}">
                </video>
                <br><br>
                <button onclick="deleteMedia('${item.name}')">
                    Delete
                </button>
            `;
    }

    mediaList.appendChild(card);
  }
}

// Add delete support
async function deleteMedia(path) {

    if (!confirm("Delete this file?")) return;

    const { error } = await supabaseClient.storage
        .from("church-media")
        .remove([path]);

    if (error) {
        alert(error.message);
        return;
    }

    loadMedia();
}