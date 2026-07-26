## ADDED Requirements

### Requirement: Incremental document generation (two-phase)
The system SHALL generate updated summary documents using a two-phase incremental process: first extracting change points from CodeDiff, then applying them to an existing document.

#### Scenario: Two-phase generation flow
- **WHEN** user initiates document generation
- **AND** selects a base document version and a target commit
- **THEN** the system fetches CodeDiff between the base commit and target commit via the repo-browser compare API
- **THEN** Phase 1 calls DeepSeek to analyze the CodeDiff and produce structured change points
- **THEN** Phase 2 calls DeepSeek with the existing document + change points to produce the updated document
- **AND** displays the generated document for preview

### Requirement: Phase 1 - Change points extraction
The system SHALL analyze a CodeDiff and extract structured change points describing what needs to change in the document.

#### Scenario: Extract change points from CodeDiff
- **WHEN** Phase 1 is invoked with a CodeDiff (file patches and statuses)
- **THEN** the system sends the CodeDiff to DeepSeek with a prompt instructing it to analyze code changes
- **AND** receives back a JSON array of change points
- **AND** each change point contains: `type` (新增/修改/删除), `file`, `summary`, `details`, and `docImpact`

#### Scenario: No significant code changes
- **WHEN** the CodeDiff contains only trivial changes (e.g., whitespace, comments, binary files)
- **THEN** DeepSeek returns an empty change-points array
- **AND** the system notifies the user "无显著代码变更" and stops

#### Scenario: Display change points for user review
- **WHEN** change points are generated
- **THEN** the system displays them in a review panel
- **AND** each change point shows: type badge (新增/修改/删除), file path, summary description
- **AND** the user can review before proceeding to Phase 2

### Requirement: Phase 2 - Apply change points to document
The system SHALL apply the generated change points to an existing document to produce a new version.

#### Scenario: Generate updated document
- **WHEN** user confirms the change points
- **THEN** the system sends the existing document content + change points to DeepSeek
- **AND** DeepSeek produces a complete updated Markdown document
- **AND** the system saves the new document to `data/docs/` with incremented version number
- **AND** the new document metadata records the target commit SHA

#### Scenario: Preview before saving
- **WHEN** the new document is generated
- **THEN** the system displays a preview of the full document content
- **AND** the user has options: "保存" or "取消"

#### Scenario: Generation fails
- **WHEN** either Phase 1 or Phase 2 fails due to API error
- **THEN** the system shows the specific error message
- **AND** provides a "重试" button
- **AND** no partial data is saved to storage

### Requirement: Reuse repo-browser compare API
The generation engine SHALL fetch CodeDiff by calling the local repo-browser compare API rather than calling GitHub directly.

#### Scenario: Fetch CodeDiff from local API
- **WHEN** generating a document update
- **THEN** the system makes an HTTP request to `http://localhost:{port}/api/repo-browser/compare?base={baseSha}&head={targetSha}`
- **AND** uses the response as the CodeDiff input for Phase 1

#### Scenario: repo-browser not available
- **WHEN** the repo-browser API returns an error
- **THEN** the system shows error "无法获取代码差异，请确保 repo-browser 模块正常工作"
