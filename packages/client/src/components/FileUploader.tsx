import React, { useState, useRef } from "react";
import {
  Upload,
  File,
  Folder,
  Archive,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export const FileUploader = () => {
  const [uploadType, setUploadType] = useState("files");
  const [dragActive, setDragActive] = useState(false);
  const [uploads, setUploads] = useState([]);
  const fileInputRef = useRef(null);
  const dirInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleUpload(files);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleUpload(files);
    }
  };

  const handleUpload = async (files) => {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    const uploadId = Date.now();
    const newUpload = {
      id: uploadId,
      files: files.map((f) => ({ name: f.name, size: f.size })),
      status: "uploading",
      progress: 0,
    };

    setUploads((prev) => [...prev, newUpload]);

    try {
      const response = await fetch("http://localhost:3000/train/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setUploads((prev) =>
          prev.map((upload) =>
            upload.id === uploadId
              ? { ...upload, status: "success", result }
              : upload
          )
        );
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      setUploads((prev) =>
        prev.map((upload) =>
          upload.id === uploadId
            ? { ...upload, status: "error", error: error.message }
            : upload
        )
      );
    }
  };

  const removeUpload = (id) => {
    setUploads((prev) => prev.filter((upload) => upload.id !== id));
  };

  const triggerFileInput = () => {
    if (uploadType === "files") {
      fileInputRef.current?.click();
    } else {
      dirInputRef.current?.click();
    }
  };

  const getIcon = (fileName) => {
    if (
      fileName.endsWith(".zip") ||
      fileName.endsWith(".rar") ||
      fileName.endsWith(".7z")
    ) {
      return <Archive className="w-4 h-4" />;
    }
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">File Upload</h1>
        <p className="text-gray-600">
          Upload files, directories, or zip archives
        </p>
      </div>

      {/* Upload Type Selector */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setUploadType("files")}
          className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
            uploadType === "files"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <File className="w-4 h-4" />
          <span>Files</span>
        </button>
        <button
          onClick={() => setUploadType("directory")}
          className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
            uploadType === "directory"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <Folder className="w-4 h-4" />
          <span>Directory</span>
        </button>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          {uploadType === "files" ? "Drop files here" : "Drop directory here"}
        </p>
        <p className="text-gray-500 mb-4">or click to browse</p>
        <button
          onClick={triggerFileInput}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Choose {uploadType === "files" ? "Files" : "Directory"}
        </button>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        accept="*/*"
      />
      <input
        ref={dirInputRef}
        type="file"
        webkitdirectory=""
        directory=""
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Upload List */}
      {uploads.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Uploads</h2>
          {uploads.map((upload) => (
            <div
              key={upload.id}
              className="bg-white border rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {upload.status === "success" && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {upload.status === "error" && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  {upload.status === "uploading" && (
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  )}
                  <span className="font-medium">
                    {upload.files.length} file
                    {upload.files.length > 1 ? "s" : ""}
                  </span>
                </div>
                <button
                  onClick={() => removeUpload(upload.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                {upload.files.slice(0, 3).map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 text-sm text-gray-600"
                  >
                    {getIcon(file.name)}
                    <span>{file.name}</span>
                    <span className="text-gray-400">
                      ({formatFileSize(file.size)})
                    </span>
                  </div>
                ))}
                {upload.files.length > 3 && (
                  <p className="text-sm text-gray-500">
                    +{upload.files.length - 3} more files
                  </p>
                )}
              </div>

              {upload.status === "success" && upload.result && (
                <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-700">
                  Upload successful! {upload.result.message}
                </div>
              )}

              {upload.status === "error" && (
                <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                  Error: {upload.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
