"use client";

import React, {
  useCallback,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import { useDropzone } from "react-dropzone";
import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";
import Image from "next/image";

import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import FilePondPluginFileValidateSize from "filepond-plugin-file-validate-size";

import { cn } from "@/lib/utils";
import { Cloud, Trash2 } from "lucide-react";

registerPlugin(
  FilePondPluginImagePreview,
  FilePondPluginFileValidateType,
  FilePondPluginFileValidateSize
);

export interface ExistingFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  created_at: string;
}

interface FileUploadProps {
  onFilesChange?: (files: File[]) => void;
  onFileClick?: (file: File | ExistingFile) => void;
  onExistingFileClick?: (file: ExistingFile) => void;
  onExistingFileRemove?: (file: ExistingFile) => void;
  existingFiles?: ExistingFile[]; // Files from database
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedFileTypes?: string[];
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  description?: string;
  error?: string;
  clearTrigger?: boolean; // New prop to trigger clearing
}

interface FileWithPreview extends File {
  preview?: string;
}

export interface FileUploadRef {
  clearFiles: () => void;
}

export const FileUpload = forwardRef<FileUploadRef, FileUploadProps>(
  (
    {
      onFilesChange,
      onFileClick,
      onExistingFileClick,
      onExistingFileRemove,
      existingFiles = [],
      maxFiles = 5,
      maxSize = 10, // 10MB
      acceptedFileTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/jpeg",
        "image/png",
      ],
      className,
      disabled = false,
      placeholder = "Upload a file or drag and drop",
      description = "PDF, DOCX, XLSX, JPG, PNG up to 10MB",
      error,
      clearTrigger = false,
    },
    ref
  ) => {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [filePondFiles, setFilePondFiles] = useState<any[]>([]);
    const [isDragActive, setIsDragActive] = useState(false);
    const [filePondError, setFilePondError] = useState<string>("");
    const filePondRef = useRef<FilePond>(null);

    // Clear files when clearTrigger changes to true
    useEffect(() => {
      if (clearTrigger) {
        // Clear FilePond files
        if (filePondRef.current) {
          filePondRef.current.removeFiles();
        }
        // Clear local state
        setFiles([]);
        setFilePondFiles([]);
        setFilePondError("");
      }
    }, [clearTrigger, onFilesChange]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      clearFiles: () => {
        // Clear FilePond files
        if (filePondRef.current) {
          filePondRef.current.removeFiles();
        }
        // Clear local state
        setFiles([]);
        setFilePondFiles([]);
        setFilePondError("");
      },
    }));

    // Handle FilePond file changes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleFilePondUpdate = (filePondFiles: any[]) => {
      setFilePondFiles(filePondFiles);

      // Get all File objects from FilePond
      const actualFiles = filePondFiles
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((filePondFile: any) => filePondFile.file instanceof File)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((filePondFile: any) => filePondFile.file as File);

      setFiles(actualFiles);
      onFilesChange?.(actualFiles);
      // Clear any previous errors when files are successfully added
      setFilePondError("");
    };

    // Handle file click to open in new tab
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleFileClick = (filePondFile: any) => {
      if (filePondFile.file instanceof File) {
        const file = filePondFile.file as File;
        const fileUrl = URL.createObjectURL(file);

        // Open file in new tab
        window.open(fileUrl, "_blank");

        // Call the optional callback
        onFileClick?.(file);

        // Clean up the object URL after a delay to allow the browser to load it
        setTimeout(() => {
          URL.revokeObjectURL(fileUrl);
        }, 1000);
      }
    };

    // Handle existing file click to open in new tab
    const handleExistingFileClick = (file: ExistingFile) => {
      // Open file in new tab
      window.open(file.url, "_blank");

      // Call the optional callback
      onExistingFileClick?.(file);
      onFileClick?.(file);
    };

    // Handle existing file removal
    const handleExistingFileRemove = (
      file: ExistingFile,
      event: React.MouseEvent
    ) => {
      event.stopPropagation(); // Prevent triggering the click handler
      onExistingFileRemove?.(file);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleFilePondError = (error: any) => {
      console.log("FilePond error:", error);
      // Handle different error formats
      let errorMessage = "An error occurred while adding the file";

      if (typeof error === "string") {
        errorMessage = error;
      } else if (error && typeof error === "object") {
        if (error.main) {
          errorMessage = error.main;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.type) {
          errorMessage = error.type;
        }
      }

      setFilePondError(errorMessage);
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
      // Add files to FilePond
      acceptedFiles.forEach((file) => {
        if (filePondRef.current) {
          filePondRef.current.addFile(file);
        }
      });
    }, []);

    const { getRootProps, getInputProps, isDragReject } = useDropzone({
      onDrop,
      accept: {
        "application/pdf": [".pdf"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          [".docx"],
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
          ".xlsx",
        ],
        "image/jpeg": [".jpg", ".jpeg"],
        "image/png": [".png"],
      },
      maxSize: maxSize * 1024 * 1024, // Convert MB to bytes
      maxFiles,
      disabled,
      onDragEnter: () => setIsDragActive(true),
      onDragLeave: () => setIsDragActive(false),
      onDropAccepted: () => setIsDragActive(false),
      onDropRejected: () => setIsDragActive(false),
    });

    return (
      <div className={cn("space-y-4", className)}>
        {/* Custom styles for FilePond */}
        <style jsx global>{`
          .filepond-custom .filepond--root {
            font-family: inherit;
          }
          .filepond-custom .filepond--drop-label {
            color: #6b7280;
            font-size: 0.875rem;
          }
          .filepond-custom .filepond--panel-root {
            border: 2px dashed #d1d5db;
            border-radius: 0.5rem;
            background-color: #f9fafb;
          }
          .filepond-custom .filepond--panel-root:hover {
            border-color: #9ca3af;
          }
          .filepond-custom .filepond--item {
            background-color: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 0.375rem;
          }
          .filepond-custom .filepond--item-panel {
            background-color: #ffffff;
          }
          .filepond-custom .filepond--file-info-main {
            font-size: 0.875rem;
            font-weight: 500;
            color: #374151;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .filepond-custom .filepond--file-info-sub {
            font-size: 0.75rem;
            color: #6b7280;
          }
          .filepond-custom .filepond--file-wrapper {
            height: auto;
            min-height: 60px;
          }
          .filepond-custom .filepond--file {
            display: flex;
            align-items: center;
            padding: 0.75rem;
          }
          .filepond-custom .filepond--file-info {
            display: flex;
            flex-direction: column;
            justify-content: center;
            flex: 1;
            margin-left: 0.75rem;
          }
          .filepond-custom .filepond--file-action-button {
            background-color: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 0.375rem;
            color: #374151;
          }
          .filepond-custom .filepond--file-action-button:hover {
            background-color: #e5e7eb;
            border-color: #9ca3af;
          }
          .filepond-custom .filepond--file-poster {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 0.375rem;
          }
          .filepond-custom .filepond--image-preview-wrapper {
            background-color: #ffffff;
          }
          .filepond-custom .filepond--file-info-main {
            display: block !important;
            max-width: 200px;
          }
          .filepond-custom .filepond--file-info-sub {
            display: block !important;
          }
        `}</style>

        {/* Existing Files Preview */}
        {existingFiles.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">
              Existing Files ({existingFiles.length})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {existingFiles.map((file) => (
                <div
                  key={file.id}
                  onClick={() => handleExistingFileClick(file)}
                  className="relative group bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:border-gray-300"
                >
                  {/* File Preview */}
                  <div className="aspect-video relative bg-gray-50 flex items-center justify-center">
                    {file.type.startsWith("image") ? (
                      <Image
                        src={file.url}
                        alt={file.name}
                        fill
                        sizes="100vw"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 rounded-lg flex flex-col items-center justify-center p-3">
                        <div className="text-lg font-semibold text-gray-600 mb-2">
                          {file.name.split(".").pop()?.toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-500 text-center truncate w-full">
                          {file.name}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                    {/* Click indicator */}
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <svg
                        className="w-3 h-3 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </div>

                    {/* Delete button */}
                    {onExistingFileRemove && !disabled && (
                      <button
                        type="button"
                        onClick={(e) => handleExistingFileRemove(file, e)}
                        className="w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-sm transition-colors duration-200"
                        title="Remove file"
                      >
                        <Trash2 className="w-3 h-3 text-white" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FilePond Component */}
        <div className="filepond-wrapper">
          <FilePond
            ref={filePondRef}
            files={filePondFiles}
            onupdatefiles={handleFilePondUpdate}
            onerror={handleFilePondError}
            onactivatefile={handleFileClick}
            allowMultiple={maxFiles > 1}
            maxFiles={maxFiles}
            maxFileSize={`${maxSize}MB`}
            acceptedFileTypes={acceptedFileTypes}
            allowImagePreview={true}
            allowFileTypeValidation={true}
            allowFileSizeValidation={true}
            allowRevert={false}
            allowRemove={true}
            allowReplace={true}
            allowReorder={false}
            allowProcess={false}
            instantUpload={false}
            labelIdle={placeholder}
            labelFileTypeNotAllowed="File type not allowed"
            labelMaxFileSizeExceeded="File size exceeds maximum allowed size"
            labelMaxFileSize="Maximum file size is {filesize}"
            labelFileProcessing="Uploading..."
            labelFileProcessingComplete="Upload complete"
            labelFileProcessingAborted="Upload cancelled"
            labelFileProcessingRevertError="Undo"
            labelFileRemoveError="Error during remove"
            labelFileLoading="Loading..."
            labelFileLoadError="Error during load"
            server={null} // We're handling files locally
            disabled={disabled}
            className="filepond-custom"
          />
        </div>

        {/* Dropzone Overlay for better UX */}
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
            isDragActive && !isDragReject && "border-blue-400 bg-blue-50",
            isDragReject && "border-red-400 bg-red-50",
            !isDragActive &&
              !isDragReject &&
              "border-gray-300 hover:border-gray-400",
            disabled && "opacity-50 cursor-not-allowed",
            "hidden" // Hide this when FilePond is visible
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <Cloud className="h-8 w-8 text-gray-400" />
            <div className="text-sm text-gray-600">
              <span className="font-medium">{placeholder}</span>
            </div>
            <div className="text-xs text-gray-500">{description}</div>
          </div>
        </div>

        {/* File Count Display */}
        {(files.length > 0 || existingFiles.length > 0) && (
          <div className="text-xs text-gray-500 text-center">
            {existingFiles.length > 0 &&
              `${existingFiles.length} existing files`}
            {existingFiles.length > 0 && files.length > 0 && " • "}
            {files.length > 0 && `${files.length} new files uploaded`}
            {files.length > 0 &&
              ` (${files.length + existingFiles.length} total)`}
          </div>
        )}

        {/* Error Message Display */}
        {(error || filePondError) && (
          <div className="space-y-1">
            {error && <div className="text-xs text-red-500">{error}</div>}
            {filePondError && (
              <div className="text-xs text-red-500">{filePondError}</div>
            )}
          </div>
        )}
      </div>
    );
  }
);

FileUpload.displayName = "FileUpload";
