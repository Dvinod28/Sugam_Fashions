import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  deleteObject,
  ref,
} from "firebase/storage";
import {
  HiOutlineDocument,
  HiOutlineDownload,
  HiOutlinePencil,
  HiOutlinePhotograph,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineTrash,
  HiOutlineX,
} from "react-icons/hi";
import { auth, db, storage } from "../../firebase/config";

const DEFAULT_ACCEPT = ".dxe,.svg,image/svg+xml";
const ALLOWED_EXTENSIONS = ["DXE", "SVG"];
const FIRESTORE_FILE_LIMIT_BYTES = 700 * 1024;

const formatBytes = (bytes = 0) => {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const sanitizePathPart = (value) =>
  String(value || "file")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "file";

const getExtension = (name = "") => {
  const parts = String(name).split(".");
  return parts.length > 1 ? parts.pop().toUpperCase() : "FILE";
};

const isImageFile = (file) =>
  String(file?.contentType || file?.type || "").startsWith("image/");

const isAllowedFile = (file) => ALLOWED_EXTENSIONS.includes(getExtension(file.name));

const getFirebaseErrorMessage = (error) => {
  if (error?.code === "storage/unauthorized") {
    return "Firebase Storage denied this upload. Update Storage rules for cad-files/... or log in again.";
  }
  if (error?.code === "storage/canceled") {
    return "Upload was cancelled.";
  }
  if (error?.code === "storage/quota-exceeded") {
    return "Firebase Storage quota exceeded.";
  }
  if (error?.code === "storage/retry-limit-exceeded") {
    return "Firebase Storage retry limit exceeded. Check network connection and Storage rules.";
  }
  if (error?.code === "permission-denied") {
    return "Firestore denied saving the file record. Update rules for cadFiles.";
  }
  return error?.message || "Failed to upload file.";
};

const withTimeout = (promise, timeoutMs, message) => {
  let timerId;
  const timeoutPromise = new Promise((_, reject) => {
    timerId = window.setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => window.clearTimeout(timerId));
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });

const openFile = (file) => {
  const fileUrl = file.contentDataUrl || file.url;
  if (!fileUrl) return;
  window.open(fileUrl, "_blank", "noopener,noreferrer");
};

const downloadFile = (file) => {
  const fileUrl = file.contentDataUrl || file.url;
  if (!fileUrl) return;
  const link = document.createElement("a");
  link.href = fileUrl;
  link.download = file.name || "cad-file";
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const FirebaseFileManager = ({
  collectionName = "cadFiles",
  section = "cad",
  storageFolder = "cad-files",
  accept = DEFAULT_ACCEPT,
  maxFiles = 100,
  maxSizeMb = 100,
  label = "File Management",
  helperText = "Upload only DXE and SVG files.",
  disabled = false,
}) => {
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editingName, setEditingName] = useState("");
  const [savingId, setSavingId] = useState("");

  useEffect(() => {
    setLoading(true);
    const loadingTimer = window.setTimeout(() => {
      setLoading(false);
      setError("Files are taking too long to load. Please check Firebase rules or network connection.");
    }, 12000);

    const unsubscribe = onSnapshot(
      collection(db, collectionName),
      (snapshot) => {
        window.clearTimeout(loadingTimer);
        const nextFiles = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .filter((item) => item.section === section)
          .sort((a, b) => {
            const dateA = a.createdAt?.seconds || Date.parse(a.uploadedAt || "") / 1000 || 0;
            const dateB = b.createdAt?.seconds || Date.parse(b.uploadedAt || "") / 1000 || 0;
            return dateB - dateA;
          });
        setFiles(nextFiles);
        setLoading(false);
      },
      (snapshotError) => {
        window.clearTimeout(loadingTimer);
        setError(snapshotError?.message || "Failed to load files.");
        setLoading(false);
      }
    );

    return () => {
      window.clearTimeout(loadingTimer);
      unsubscribe();
    };
  }, [collectionName, section]);

  const filteredFiles = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return files;
    return files.filter((file) => {
      const name = String(file.name || "").toLowerCase();
      const type = String(file.contentType || "").toLowerCase();
      const extension = String(file.extension || "").toLowerCase();
      return name.includes(term) || type.includes(term) || extension.includes(term);
    });
  }, [files, search]);

  const uploadDisabled = disabled || files.length >= maxFiles;

  const setUploadProgress = (path, progress, status = "Uploading") => {
    setUploadingFiles((current) =>
      current.map((item) =>
        item.storagePath === path ? { ...item, progress, status } : item
      )
    );
  };

  const uploadOneFile = async (file) => {
    const timestamp = Date.now();
    const fileName = sanitizePathPart(file.name);
    const extension = getExtension(file.name);
    const path = `${storageFolder}/${sanitizePathPart(section)}/${timestamp}-${fileName}`;

    setUploadingFiles((current) => [
      ...current,
      { name: file.name, progress: 5, storagePath: path, status: "Reading file" },
    ]);

    const contentType =
      extension === "SVG" ? "image/svg+xml" : file.type || "application/octet-stream";

    if (!auth.currentUser) {
      throw new Error("You must be logged in before uploading files.");
    }

    if (file.size > FIRESTORE_FILE_LIMIT_BYTES) {
      throw new Error(
        `${file.name} is too large for quick Firestore upload. Keep DXE/SVG files under ${formatBytes(FIRESTORE_FILE_LIMIT_BYTES)} or enable Firebase Storage rules.`
      );
    }

    setUploadProgress(path, 35, "Preparing file data");
    const contentDataUrl = await withTimeout(
      readFileAsDataUrl(file),
      30000,
      "Reading the file took too long."
    );

    const fileRecord = {
      name: file.name,
      url: contentDataUrl,
      storagePath: "",
      section,
      extension,
      size: file.size,
      contentType,
      contentDataUrl,
      storageMode: "firestore",
      createdAt: serverTimestamp(),
      uploadedAt: new Date().toISOString(),
    };

    setUploadProgress(path, 75, "Saving file");
    const docRef = await withTimeout(
      addDoc(collection(db, collectionName), fileRecord),
      30000,
      "Saving the file record timed out."
    );

    setFiles((current) => [{ id: docRef.id, ...fileRecord }, ...current]);
    setUploadProgress(path, 100, "Done");
    return { id: docRef.id, ...fileRecord };
  };

  const handleFileSelect = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";
    setError("");

    if (!selectedFiles.length) return;

    const unsupported = selectedFiles.find((file) => !isAllowedFile(file));
    if (unsupported) {
      setError(`${unsupported.name} is not allowed. Upload only .dxe or .svg files.`);
      return;
    }

    const remainingSlots = maxFiles - files.length;
    const oversized = selectedFiles.find((file) => file.size > maxSizeMb * 1024 * 1024);

    if (selectedFiles.length > remainingSlots) {
      setError(`Only ${remainingSlots} more file${remainingSlots === 1 ? "" : "s"} can be uploaded.`);
      return;
    }

    if (oversized) {
      setError(`${oversized.name} is larger than ${maxSizeMb} MB.`);
      return;
    }

    try {
      for (const file of selectedFiles) {
        await uploadOneFile(file);
      }
    } catch (uploadError) {
      setError(getFirebaseErrorMessage(uploadError));
    } finally {
      setUploadingFiles([]);
    }
  };

  const startEdit = (file) => {
    setEditingId(file.id);
    setEditingName(file.name || "");
    setError("");
  };

  const cancelEdit = () => {
    setEditingId("");
    setEditingName("");
  };

  const handleUpdate = async (file) => {
    const nextName = editingName.trim();
    if (!nextName) {
      setError("File name cannot be empty.");
      return;
    }

    const nextExtension = getExtension(nextName);
    if (!ALLOWED_EXTENSIONS.includes(nextExtension)) {
      setError("File name must keep a .dxe or .svg extension.");
      return;
    }

    setSavingId(file.id);
    setError("");
    try {
      await updateDoc(doc(db, collectionName, file.id), {
        name: nextName,
        extension: nextExtension,
        updatedAt: serverTimestamp(),
      });
      cancelEdit();
    } catch (updateError) {
      setError(updateError?.message || "Failed to update file.");
    } finally {
      setSavingId("");
    }
  };

  const handleDelete = async (file) => {
    if (disabled) return;
    const confirmed = window.confirm(`Delete ${file.name || "this file"}?`);
    if (!confirmed) return;

    setError("");
    try {
      if (file.storagePath) {
        await deleteObject(ref(storage, file.storagePath));
      }
      await deleteDoc(doc(db, collectionName, file.id));
    } catch (deleteError) {
      setError(deleteError?.message || "Failed to delete file.");
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{label}</h3>
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        </div>
        <button
          type="button"
          disabled={uploadDisabled}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-pink-200 px-4 py-2 text-sm font-semibold text-pink-700 transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <HiOutlinePlus className="h-4 w-4" />
          Upload DXE/SVG
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <HiOutlineSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search files"
            className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-pink-400 focus:outline-none"
          />
        </div>
        <div className="text-sm text-gray-500">
          {files.length}/{maxFiles} files
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={handleFileSelect}
      />

      {error && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {uploadingFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploadingFiles.map((file) => (
            <div key={file.storagePath} className="rounded-md border border-gray-200 p-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium text-gray-800">{file.name}</span>
                <span className="text-gray-500">{file.progress}%</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">{file.status || "Uploading"}</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-pink-500 transition-all"
                  style={{ width: `${file.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 px-3 py-6 text-center text-sm text-gray-500">
          Loading files...
        </div>
      ) : filteredFiles.length > 0 ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 p-3"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-white">
                {isImageFile(file) ? (
                  <img
                    src={file.contentDataUrl || file.url}
                    alt={file.name || "Uploaded file"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <HiOutlineDocument className="h-6 w-6 text-gray-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                {editingId === file.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm font-semibold text-gray-900 focus:border-pink-400 focus:outline-none"
                  />
                ) : (
                  <p className="truncate text-sm font-semibold text-gray-900">{file.name || "Uploaded file"}</p>
                )}
                <p className="text-xs text-gray-500">
                  {file.extension || getExtension(file.name)} {file.size ? `- ${formatBytes(file.size)}` : ""}
                </p>
              </div>
              {editingId === file.id ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleUpdate(file)}
                    disabled={savingId === file.id}
                    className="rounded-md px-2 py-1 text-sm font-semibold text-pink-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingId === file.id ? "Saving" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded-md p-2 text-gray-500 transition hover:bg-white"
                    title="Cancel edit"
                  >
                    <HiOutlineX className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => startEdit(file)}
                  disabled={disabled}
                  className="rounded-md p-2 text-gray-500 transition hover:bg-white hover:text-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Edit file"
                >
                  <HiOutlinePencil className="h-5 w-5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => openFile(file)}
                className="rounded-md p-2 text-gray-500 transition hover:bg-white hover:text-pink-600"
                title="Open file"
              >
                {isImageFile(file) ? (
                  <HiOutlinePhotograph className="h-5 w-5" />
                ) : (
                  <HiOutlineDocument className="h-5 w-5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => downloadFile(file)}
                className="rounded-md p-2 text-gray-500 transition hover:bg-white hover:text-pink-600"
                title="Download file"
              >
                  <HiOutlineDownload className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(file)}
                disabled={disabled}
                className="rounded-md p-2 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                title="Delete file"
              >
                <HiOutlineTrash className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-2 rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-6 text-sm text-gray-500">
          <HiOutlineX className="h-4 w-4" />
          No files uploaded yet.
        </div>
      )}
    </div>
  );
};

export default FirebaseFileManager;
