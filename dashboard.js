/* =========================================================
   PEFA SOWETO CATHEDRAL
   CENTRAL ADMIN DASHBOARD
   dashboard.js
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    console.log("=================================");
    console.log("PEFA ADMIN DASHBOARD");
    console.log("dashboard.js loaded successfully");
    console.log("=================================");


    /* =====================================================
       CONFIGURATION
    ===================================================== */

    const STORAGE_BUCKET = "church-media";

    /*
     * IMPORTANT STORAGE STRUCTURE
     *
     * church-media
     * ├── photos
     * │     ├── image1.jpg
     * │     ├── image2.jpg
     * │     └── ...
     *
     * └── videos
     *       ├── video1.mp4
     *       ├── video2.mp4
     *       └── ...
     */

    const PHOTO_FOLDER = "photos";
    const VIDEO_FOLDER = "videos";

    const PRAYER_TABLE = "soweto_pefa_prayer_requests";

    const MAX_FILE_SIZE = 50 * 1024 * 1024;


    /* =====================================================
       ELEMENTS
    ===================================================== */

    /* AUTH */

    const logoutBtn =
        document.getElementById("logout-btn");


    /* MEDIA */

    const uploadForm =
        document.getElementById("uploadForm");

    const mediaFile =
        document.getElementById("mediaFile");

    const uploadStatus =
        document.getElementById("uploadStatus");

    const mediaList =
        document.getElementById("mediaList");

    const refreshMediaBtn =
        document.getElementById("refresh-media-btn");

    const uploadBtn =
        document.getElementById("upload-btn");


    /* PRAYER REQUESTS */

    const searchBox =
        document.getElementById("search-box");

    const refreshPrayerBtn =
        document.getElementById("refresh-btn");

    const requestsBody =
        document.getElementById("requests-body");

    const countLabel =
        document.getElementById("count-label");

    const loading =
        document.getElementById("loading");

    const emptyState =
        document.getElementById("empty-state");


    /* =====================================================
       GLOBAL DATA
    ===================================================== */

    let allPrayerRequests = [];


    /* =====================================================
       CHECK SUPABASE
    ===================================================== */

    if (typeof supabaseClient === "undefined") {

        console.error(
            "❌ supabaseClient was not found."
        );

        alert(
            "Supabase connection is missing. Please check supabase.js"
        );

        return;
    }

    console.log(
        "✅ Supabase client detected."
    );


    /* =====================================================
       AUTHENTICATION
    ===================================================== */

    checkAuthentication();


    async function checkAuthentication() {

        console.log(
            "Checking administrator authentication..."
        );

        try {

            const {
                data,
                error
            } =
                await supabaseClient.auth.getSession();


            if (error) {

                console.error(
                    "Session error:",
                    error
                );

                window.location.href =
                    "login.html";

                return;
            }


            if (
                !data ||
                !data.session
            ) {

                console.warn(
                    "❌ No active administrator session."
                );

                window.location.href =
                    "login.html";

                return;
            }


            console.log(
                "✅ Administrator session active."
            );


            /*
             * Load dashboard information
             */

            await loadMedia();

            await loadPrayerRequests();


        } catch (error) {

            console.error(
                "Authentication error:",
                error
            );

            window.location.href =
                "login.html";
        }
    }


    /* =====================================================
       LOGOUT
    ===================================================== */

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            async () => {

                console.log(
                    "Logging out..."
                );


                logoutBtn.disabled =
                    true;

                const originalText =
                    logoutBtn.textContent;

                logoutBtn.textContent =
                    "Logging out...";


                try {

                    const {
                        error
                    } =
                        await supabaseClient.auth.signOut();


                    if (error) {

                        console.error(
                            "Logout error:",
                            error
                        );

                        alert(
                            error.message
                        );

                        logoutBtn.disabled =
                            false;

                        logoutBtn.textContent =
                            originalText ||
                            "Log Out";

                        return;
                    }


                    window.location.href =
                        "login.html";


                } catch (error) {

                    console.error(
                        "Unexpected logout error:",
                        error
                    );

                    alert(
                        "Logout failed. Please try again."
                    );

                    logoutBtn.disabled =
                        false;

                    logoutBtn.textContent =
                        originalText ||
                        "Log Out";
                }
            }
        );
    }


    /* =====================================================
       MEDIA UPLOAD
    ===================================================== */

    if (uploadForm) {

        uploadForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                console.log(
                    "📤 Media upload started."
                );


                /* -----------------------------------------
                   CHECK FILE
                ----------------------------------------- */

                if (
                    !mediaFile ||
                    !mediaFile.files ||
                    mediaFile.files.length === 0
                ) {

                    showUploadStatus(
                        "Please choose a photo or video first.",
                        "error"
                    );

                    return;
                }


                const file =
                    mediaFile.files[0];


                console.log(
                    "Selected file:",
                    file.name
                );

                console.log(
                    "File type:",
                    file.type
                );

                console.log(
                    "File size:",
                    file.size
                );


                /* -----------------------------------------
                   CHECK FILE SIZE
                ----------------------------------------- */

                if (
                    file.size >
                    MAX_FILE_SIZE
                ) {

                    showUploadStatus(
                        "File is too large. Maximum size is 50MB.",
                        "error"
                    );

                    return;
                }


                /* -----------------------------------------
                   CHECK FILE TYPE
                ----------------------------------------- */

                const isImage =
                    file.type.startsWith(
                        "image/"
                    );

                const isVideo =
                    file.type.startsWith(
                        "video/"
                    );


                if (
                    !isImage &&
                    !isVideo
                ) {

                    showUploadStatus(
                        "Please select a valid image or video file.",
                        "error"
                    );

                    return;
                }


                /* -----------------------------------------
                   SELECT DESTINATION FOLDER
                ----------------------------------------- */

                const folder =
                    isImage
                        ? PHOTO_FOLDER
                        : VIDEO_FOLDER;


                /* -----------------------------------------
                   CREATE SAFE FILE NAME
                ----------------------------------------- */

                const safeFileName =
                    file.name
                        .trim()
                        .replace(
                            /\s+/g,
                            "_"
                        )
                        .replace(
                            /[^a-zA-Z0-9._-]/g,
                            ""
                        );


                const finalFileName =
                    `${Date.now()}_${safeFileName}`;


                const filePath =
                    `${folder}/${finalFileName}`;


                console.log(
                    "📁 Upload destination:",
                    filePath
                );


                /* -----------------------------------------
                   DISABLE BUTTON
                ----------------------------------------- */

                if (uploadBtn) {

                    uploadBtn.disabled =
                        true;

                    uploadBtn.textContent =
                        "Uploading...";
                }


                showUploadStatus(
                    `Uploading to ${folder}...`,
                    "loading"
                );


                /* -----------------------------------------
                   UPLOAD
                ----------------------------------------- */

                try {

                    const {
                        data,
                        error
                    } =
                        await supabaseClient.storage
                            .from(
                                STORAGE_BUCKET
                            )
                            .upload(
                                filePath,
                                file,
                                {
                                    cacheControl:
                                        "3600",

                                    contentType:
                                        file.type,

                                    upsert:
                                        false
                                }
                            );


                    /* -------------------------------------
                       UPLOAD ERROR
                    ------------------------------------- */

                    if (error) {

                        console.error(
                            "❌ SUPABASE UPLOAD ERROR:",
                            error
                        );


                        console.error(
                            "Error message:",
                            error.message
                        );


                        showUploadStatus(
                            "Upload failed: " +
                            error.message,
                            "error"
                        );


                        if (
                            error.message &&
                            error.message
                                .toLowerCase()
                                .includes(
                                    "row-level security"
                                )
                        ) {

                            console.error(
                                "⚠️ Storage RLS policy is blocking the upload."
                            );
                        }


                        return;
                    }


                    /* -------------------------------------
                       SUCCESS
                    ------------------------------------- */

                    console.log(
                        "✅ Upload successful:",
                        data
                    );


                    showUploadStatus(
                        isImage
                            ? "✅ Photo uploaded successfully!"
                            : "✅ Video uploaded successfully!",
                        "success"
                    );


                    /* -------------------------------------
                       RESET FORM
                    ------------------------------------- */

                    uploadForm.reset();


                    /* -------------------------------------
                       REFRESH MEDIA
                    ------------------------------------- */

                    await loadMedia();


                } catch (error) {

                    console.error(
                        "❌ Unexpected upload error:",
                        error
                    );


                    showUploadStatus(
                        "Upload failed. Please try again.",
                        "error"
                    );


                } finally {

                    if (uploadBtn) {

                        uploadBtn.disabled =
                            false;

                        uploadBtn.textContent =
                            "Upload Media";
                    }
                }
            }
        );
    }


    /* =====================================================
       UPLOAD STATUS
    ===================================================== */

    function showUploadStatus(
        message,
        type = "loading"
    ) {

        if (!uploadStatus) {
            return;
        }


        uploadStatus.textContent =
            message;


        uploadStatus.classList.remove(
            "success",
            "error",
            "loading"
        );


        uploadStatus.classList.add(
            type
        );


        /*
         * Inline fallback colors.
         * Your CSS can override these.
         */

        if (
            type === "success"
        ) {

            uploadStatus.style.color =
                "#86efac";

        } else if (
            type === "error"
        ) {

            uploadStatus.style.color =
                "#ff6b6b";

        } else {

            uploadStatus.style.color =
                "#facc15";
        }
    }


    /* =====================================================
       REFRESH MEDIA
    ===================================================== */

    if (refreshMediaBtn) {

        refreshMediaBtn.addEventListener(
            "click",
            async () => {

                refreshMediaBtn.disabled =
                    true;


                const originalText =
                    refreshMediaBtn.textContent;


                refreshMediaBtn.textContent =
                    "Refreshing...";


                try {

                    await loadMedia();

                } finally {

                    refreshMediaBtn.disabled =
                        false;

                    refreshMediaBtn.textContent =
                        originalText ||
                        "↻ Refresh";
                }
            }
        );
    }


    /* =====================================================
       LOAD MEDIA
    ===================================================== */

    async function loadMedia() {

        if (!mediaList) {

            console.error(
                "❌ mediaList element not found."
            );

            return;
        }


        mediaList.innerHTML =
            `
            <div class="dashboard-loading">
                <i class="fas fa-spinner fa-spin"></i>
                Loading church media...
            </div>
            `;


        console.log(
            "📂 Loading church media..."
        );


        try {

            /*
             * Load photos and videos separately.
             *
             * This matches the public website:
             *
             * church-media/photos
             *
             * and allows videos to live in:
             *
             * church-media/videos
             */

            const [
                photosResult,
                videosResult,
                rootResult
            ] =
                await Promise.all([
                    listFolder(
                        PHOTO_FOLDER
                    ),

                    listFolder(
                        VIDEO_FOLDER
                    ),

                    listFolder("")
                ]);


            if (
                photosResult.error
            ) {

                console.error(
                    "Photos folder error:",
                    photosResult.error
                );
            }


            if (
                videosResult.error
            ) {

                console.error(
                    "Videos folder error:",
                    videosResult.error
                );
            }


            if (
                rootResult.error
            ) {

                console.error(
                    "Root storage error:",
                    rootResult.error
                );
            }


            /*
             * Build media records.
             */

            const mediaItems = [];


            /* PHOTOS */

            if (
                photosResult.data
            ) {

                photosResult.data.forEach(
                    (item) => {

                        if (
                            isRealFile(item)
                        ) {

                            mediaItems.push({
                                ...item,
                                folder:
                                    PHOTO_FOLDER,
                                path:
                                    `${PHOTO_FOLDER}/${item.name}`,
                                mediaType:
                                    "image"
                            });
                        }
                    }
                );
            }


            /* VIDEOS */

            if (
                videosResult.data
            ) {

                videosResult.data.forEach(
                    (item) => {

                        if (
                            isRealFile(item)
                        ) {

                            mediaItems.push({
                                ...item,
                                folder:
                                    VIDEO_FOLDER,
                                path:
                                    `${VIDEO_FOLDER}/${item.name}`,
                                mediaType:
                                    "video"
                            });
                        }
                    }
                );
            }


            /*
             * ROOT FILES
             *
             * Keep support for files uploaded by
             * the OLD dashboard version.
             */

            if (
                rootResult.data
            ) {

                rootResult.data.forEach(
                    (item) => {

                        if (
                            isRealFile(item)
                        ) {

                            const alreadyIncluded =
                                mediaItems.some(
                                    (media) =>
                                        media.path ===
                                        item.name
                                );


                            if (
                                !alreadyIncluded
                            ) {

                                const mime =
                                    item.metadata
                                        ?.mimetype ||
                                    "";


                                mediaItems.push({
                                    ...item,
                                    folder:
                                        "",
                                    path:
                                        item.name,
                                    mediaType:
                                        mime.startsWith(
                                            "image/"
                                        )
                                            ? "image"
                                            : mime.startsWith(
                                                "video/"
                                            )
                                                ? "video"
                                                : "file"
                                });
                            }
                        }
                    }
                );
            }


            /*
             * Sort newest first.
             */

            mediaItems.sort(
                (
                    a,
                    b
                ) => {

                    const dateA =
                        new Date(
                            a.created_at ||
                            0
                        ).getTime();

                    const dateB =
                        new Date(
                            b.created_at ||
                            0
                        ).getTime();

                    return dateB - dateA;
                }
            );


            mediaList.innerHTML =
                "";


            /* -----------------------------------------
               NO MEDIA
            ----------------------------------------- */

            if (
                mediaItems.length === 0
            ) {

                mediaList.innerHTML =
                    `
                    <div class="dashboard-loading">
                        <i class="fas fa-photo-video"></i>

                        <p>
                            No church media uploaded yet.
                        </p>

                        <small>
                            Photos will be stored in
                            church-media/photos.
                        </small>
                    </div>
                    `;

                return;
            }


            /* -----------------------------------------
               DISPLAY MEDIA
            ----------------------------------------- */

            mediaItems.forEach(
                (item) => {

                    createMediaCard(
                        item
                    );
                }
            );


        } catch (error) {

            console.error(
                "❌ Unexpected media loading error:",
                error
            );


            mediaList.innerHTML =
                `
                <div class="dashboard-loading">
                    Unable to load church media.

                    <br><br>

                    ${escapeHtml(
                        error.message ||
                        "Unknown error"
                    )}
                </div>
                `;
        }
    }


    /* =====================================================
       LIST STORAGE FOLDER
    ===================================================== */

    async function listFolder(
        folder
    ) {

        try {

            const {
                data,
                error
            } =
                await supabaseClient.storage
                    .from(
                        STORAGE_BUCKET
                    )
                    .list(
                        folder,
                        {
                            limit: 100,

                            sortBy: {
                                column:
                                    "created_at",

                                order:
                                    "desc"
                            }
                        }
                    );


            return {
                data:
                    data || [],

                error:
                    error || null
            };


        } catch (error) {

            return {
                data: [],

                error
            };
        }
    }


    /* =====================================================
       CHECK REAL FILE
    ===================================================== */

    function isRealFile(
        item
    ) {

        /*
         * Supabase folders have no file id.
         */

        return (
            item &&
            item.id !== null &&
            item.id !== undefined
        );
    }


    /* =====================================================
       CREATE MEDIA CARD
    ===================================================== */

    function createMediaCard(
        item
    ) {

        if (!mediaList) {
            return;
        }


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "media-card";


        const {
            data: urlData
        } =
            supabaseClient.storage
                .from(
                    STORAGE_BUCKET
                )
                .getPublicUrl(
                    item.path
                );


        const publicUrl =
            urlData?.publicUrl ||
            "";


        const mimeType =
            item.metadata?.mimetype ||
            "";


        /* -----------------------------------------
           IMAGE
        ----------------------------------------- */

        if (
            item.mediaType === "image" ||
            mimeType.startsWith(
                "image/"
            )
        ) {

            card.innerHTML =
                `
                <div class="media-preview">

                    <img
                        src="${escapeAttribute(publicUrl)}"
                        alt="Church Gallery"
                        loading="lazy"
                    >

                </div>

                <div class="media-info">

                    <strong>
                        ${escapeHtml(
                            item.name
                        )}
                    </strong>

                    <small>
                        📁 ${escapeHtml(
                            item.folder ||
                            "root"
                        )}
                    </small>

                </div>

                <button
                    type="button"
                    class="delete-media-btn"
                    data-file="${escapeAttribute(
                        item.path
                    )}"
                >
                    <i class="fas fa-trash"></i>
                    Delete
                </button>
                `;

        }


        /* -----------------------------------------
           VIDEO
        ----------------------------------------- */

        else if (
            item.mediaType === "video" ||
            mimeType.startsWith(
                "video/"
            )
        ) {

            card.innerHTML =
                `
                <div class="media-preview">

                    <video
                        controls
                        preload="metadata"
                    >

                        <source
                            src="${escapeAttribute(
                                publicUrl
                            )}"
                            type="${escapeAttribute(
                                mimeType
                            )}"
                        >

                        Your browser does not support
                        video playback.

                    </video>

                </div>

                <div class="media-info">

                    <strong>
                        ${escapeHtml(
                            item.name
                        )}
                    </strong>

                    <small>
                        📁 ${escapeHtml(
                            item.folder ||
                            "root"
                        )}
                    </small>

                </div>

                <button
                    type="button"
                    class="delete-media-btn"
                    data-file="${escapeAttribute(
                        item.path
                    )}"
                >
                    <i class="fas fa-trash"></i>
                    Delete
                </button>
                `;

        }


        /* -----------------------------------------
           UNKNOWN FILE
        ----------------------------------------- */

        else {

            card.innerHTML =
                `
                <div class="media-preview unknown-media">

                    <i class="fas fa-file"></i>

                </div>

                <div class="media-info">

                    <strong>
                        ${escapeHtml(
                            item.name
                        )}
                    </strong>

                    <small>
                        📁 ${escapeHtml(
                            item.folder ||
                            "root"
                        )}
                    </small>

                </div>

                <button
                    type="button"
                    class="delete-media-btn"
                    data-file="${escapeAttribute(
                        item.path
                    )}"
                >
                    <i class="fas fa-trash"></i>
                    Delete
                </button>
                `;
        }


        mediaList.appendChild(
            card
        );


        /* -----------------------------------------
           DELETE BUTTON
        ----------------------------------------- */

        const deleteButton =
            card.querySelector(
                ".delete-media-btn"
            );


        if (deleteButton) {

            deleteButton.addEventListener(
                "click",
                async () => {

                    await deleteMedia(
                        deleteButton,
                        item.path
                    );
                }
            );
        }
    }


    /* =====================================================
       DELETE MEDIA
    ===================================================== */

    async function deleteMedia(
        button,
        filePath
    ) {

        const confirmed =
            confirm(
                "Are you sure you want to delete this media file?"
            );


        if (!confirmed) {
            return;
        }


        button.disabled =
            true;

        button.innerHTML =
            `
            <i class="fas fa-spinner fa-spin"></i>
            Deleting...
            `;


        console.log(
            "Deleting media:",
            filePath
        );


        try {

            const {
                error
            } =
                await supabaseClient.storage
                    .from(
                        STORAGE_BUCKET
                    )
                    .remove([
                        filePath
                    ]);


            if (error) {

                console.error(
                    "Delete error:",
                    error
                );


                alert(
                    "Delete failed: " +
                    error.message
                );


                button.disabled =
                    false;

                button.innerHTML =
                    `
                    <i class="fas fa-trash"></i>
                    Delete
                    `;

                return;
            }


            console.log(
                "✅ Media deleted successfully."
            );


            await loadMedia();


        } catch (error) {

            console.error(
                "Unexpected delete error:",
                error
            );


            alert(
                "Could not delete media."
            );


            button.disabled =
                false;

            button.innerHTML =
                `
                <i class="fas fa-trash"></i>
                Delete
                `;
        }
    }


    /* =====================================================
       REFRESH PRAYER REQUESTS
    ===================================================== */

    if (refreshPrayerBtn) {

        refreshPrayerBtn.addEventListener(
            "click",
            async () => {

                await loadPrayerRequests();
            }
        );
    }


    /* =====================================================
       LOAD PRAYER REQUESTS
    ===================================================== */

    async function loadPrayerRequests() {

        if (!requestsBody) {

            console.error(
                "❌ requests-body element not found."
            );

            return;
        }


        if (loading) {

            loading.style.display =
                "block";
        }


        if (emptyState) {

            emptyState.style.display =
                "none";
        }


        try {

            console.log(
                "🙏 Loading prayer requests..."
            );


            const {
                data,
                error
            } =
                await supabaseClient
                    .from(
                        PRAYER_TABLE
                    )
                    .select("*")
                    .order(
                        "created_at",
                        {
                            ascending:
                                false
                        }
                    );


            if (error) {

                console.error(
                    "❌ Prayer request error:",
                    error
                );


                allPrayerRequests =
                    [];


                requestsBody.innerHTML =
                    "";


                if (emptyState) {

                    emptyState.style.display =
                        "block";

                    emptyState.textContent =
                        "Failed to load prayer requests: " +
                        error.message;
                }


                return;
            }


            allPrayerRequests =
                data || [];


            console.log(
                "Prayer requests loaded:",
                allPrayerRequests.length
            );


            renderPrayerRequests(
                allPrayerRequests
            );


        } catch (error) {

            console.error(
                "Unexpected prayer request error:",
                error
            );


            if (emptyState) {

                emptyState.style.display =
                    "block";

                emptyState.textContent =
                    "Unable to load prayer requests.";
            }


        } finally {

            if (loading) {

                loading.style.display =
                    "none";
            }
        }
    }


    /* =====================================================
       RENDER PRAYER REQUESTS
    ===================================================== */

    function renderPrayerRequests(
        rows
    ) {

        if (!requestsBody) {
            return;
        }


        requestsBody.innerHTML =
            "";


        if (countLabel) {

            countLabel.textContent =
                `${rows.length} total`;
        }


        /* -----------------------------------------
           EMPTY
        ----------------------------------------- */

        if (
            !rows ||
            rows.length === 0
        ) {

            if (emptyState) {

                emptyState.style.display =
                    "block";

                emptyState.textContent =
                    "No prayer requests found.";
            }


            return;
        }


        if (emptyState) {

            emptyState.style.display =
                "none";
        }


        /* -----------------------------------------
           CREATE ROWS
        ----------------------------------------- */

        rows.forEach(
            (row) => {

                const tr =
                    document.createElement(
                        "tr"
                    );


                const date =
                    row.created_at
                        ? new Date(
                            row.created_at
                        ).toLocaleString()
                        : "-";


                const status =
                    row.status ||
                    "pending";


                tr.innerHTML =
                    `
                    <td>
                        ${escapeHtml(
                            date
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            row.name ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            row.phone ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            row.email ||
                            "-"
                        )}
                    </td>

                    <td class="request-cell">
                        ${escapeHtml(
                            row.request ||
                            "-"
                        )}
                    </td>

                    <td>

                        <select
                            class="status-select"
                            data-id="${escapeAttribute(
                                row.id
                            )}"
                        >

                            <option
                                value="pending"
                                ${
                                    status ===
                                    "pending"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Pending
                            </option>

                            <option
                                value="prayed for"
                                ${
                                    status ===
                                    "prayed for"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Prayed For
                            </option>

                            <option
                                value="done"
                                ${
                                    status ===
                                    "done"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Done
                            </option>

                        </select>

                    </td>
                    `;


                requestsBody.appendChild(
                    tr
                );
            }
        );


        attachStatusHandlers();
    }


    /* =====================================================
       PRAYER STATUS UPDATE
    ===================================================== */

    function attachStatusHandlers() {

        if (!requestsBody) {
            return;
        }


        const selects =
            requestsBody.querySelectorAll(
                ".status-select"
            );


        selects.forEach(
            (select) => {

                select.addEventListener(
                    "change",
                    async () => {

                        const requestId =
                            select.dataset.id;

                        const newStatus =
                            select.value;


                        if (!requestId) {

                            console.error(
                                "Prayer request ID missing."
                            );

                            return;
                        }


                        const oldStatus =
                            select.dataset.previous ||
                            "pending";


                        select.dataset.previous =
                            newStatus;


                        select.disabled =
                            true;


                        try {

                            console.log(
                                "Updating prayer request:",
                                requestId,
                                newStatus
                            );


                            const {
                                error
                            } =
                                await supabaseClient
                                    .from(
                                        PRAYER_TABLE
                                    )
                                    .update({
                                        status:
                                            newStatus
                                    })
                                    .eq(
                                        "id",
                                        requestId
                                    );


                            if (error) {

                                console.error(
                                    "Status update error:",
                                    error
                                );


                                alert(
                                    "Could not update status: " +
                                    error.message
                                );


                                select.value =
                                    oldStatus;

                                select.dataset.previous =
                                    oldStatus;

                                return;
                            }


                            /*
                             * Update local data too.
                             */

                            const request =
                                allPrayerRequests.find(
                                    (item) =>
                                        String(
                                            item.id
                                        ) ===
                                        String(
                                            requestId
                                        )
                                );


                            if (request) {

                                request.status =
                                    newStatus;
                            }


                            console.log(
                                "✅ Prayer status updated."
                            );


                        } catch (error) {

                            console.error(
                                "Unexpected status update error:",
                                error
                            );


                            alert(
                                "Status update failed."
                            );


                            select.value =
                                oldStatus;


                            select.dataset.previous =
                                oldStatus;


                        } finally {

                            select.disabled =
                                false;
                        }
                    }
                );
            }
        );
    }


    /* =====================================================
       SEARCH PRAYER REQUESTS
    ===================================================== */

    if (searchBox) {

        searchBox.addEventListener(
            "input",
            (event) => {

                const term =
                    event.target.value
                        .trim()
                        .toLowerCase();


                if (!term) {

                    renderPrayerRequests(
                        allPrayerRequests
                    );

                    return;
                }


                const filtered =
                    allPrayerRequests.filter(
                        (request) => {

                            const name =
                                String(
                                    request.name ||
                                    ""
                                ).toLowerCase();


                            const phone =
                                String(
                                    request.phone ||
                                    ""
                                ).toLowerCase();


                            const email =
                                String(
                                    request.email ||
                                    ""
                                ).toLowerCase();


                            const prayer =
                                String(
                                    request.request ||
                                    ""
                                ).toLowerCase();


                            const status =
                                String(
                                    request.status ||
                                    ""
                                ).toLowerCase();


                            return (
                                name.includes(
                                    term
                                ) ||

                                phone.includes(
                                    term
                                ) ||

                                email.includes(
                                    term
                                ) ||

                                prayer.includes(
                                    term
                                ) ||

                                status.includes(
                                    term
                                )
                            );
                        }
                    );


                renderPrayerRequests(
                    filtered
                );
            }
        );
    }


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHtml(
        value
    ) {

        const div =
            document.createElement(
                "div"
            );


        div.textContent =
            String(
                value ?? ""
            );


        return div.innerHTML;
    }


    /* =====================================================
       ESCAPE HTML ATTRIBUTE
    ===================================================== */

    function escapeAttribute(
        value
    ) {

        return String(
            value ?? ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            );
    }


    /* =====================================================
       FINISHED
    ===================================================== */

    console.log(
        "✅ PEFA Admin Dashboard initialized."
    );

});
