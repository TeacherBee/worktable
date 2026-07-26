## ADDED Requirements

### Requirement: View document list
The system SHALL display a list of all stored summary documents with metadata.

#### Scenario: View all documents
- **WHEN** user opens the doc-summary module
- **THEN** the system displays a list of documents showing: version number, title, associated commit SHA, creation date, last update date, and source (upload/generated)
- **AND** sorts by version number descending (newest first)

#### Scenario: Empty document list
- **WHEN** user opens the doc-summary module and no documents exist
- **THEN** the system displays an empty state message: "暂无文档" with a prompt to upload or generate one

### Requirement: Upload document from local
The system SHALL allow users to upload a Markdown (.md) file as a new document version.

#### Scenario: Upload a valid .md file
- **WHEN** user clicks "上传文档" button and selects a valid `.md` file
- **AND** user fills in: title, associated commit SHA
- **THEN** the system copies the file to `data/docs/` with a unique filename
- **AND** creates a metadata entry in `data/docs.json`
- **AND** displays success message "文档上传成功"

#### Scenario: Upload non-Markdown file
- **WHEN** user selects a file that is not `.md` format
- **THEN** the system rejects the upload with error message "仅支持 .md 格式文件"

### Requirement: View document content
The system SHALL display the full Markdown content of a selected document.

#### Scenario: Click to view document
- **WHEN** user clicks a document in the list
- **THEN** the system reads the `.md` file from `data/docs/`
- **AND** displays it in a preview panel on the right side
- **AND** renders basic Markdown (headings, lists, code blocks)

#### Scenario: View deleted document
- **WHEN** user clicks a document whose `.md` file no longer exists on disk
- **THEN** the system shows error "文档文件已丢失" and suggests re-uploading

### Requirement: Delete a document
The system SHALL allow users to delete a document version.

#### Scenario: Delete an existing document
- **WHEN** user clicks "删除" button on a document
- **AND** confirms the deletion in a confirmation dialog
- **THEN** the system removes the `.md` file from `data/docs/`
- **AND** removes the metadata entry from `data/docs.json`
- **AND** displays "文档已删除"

#### Scenario: Cancel delete
- **WHEN** user clicks "删除" button but cancels the confirmation dialog
- **THEN** no changes occur to the document or metadata
