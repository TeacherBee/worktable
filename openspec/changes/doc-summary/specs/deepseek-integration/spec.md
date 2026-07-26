## ADDED Requirements

### Requirement: DeepSeek API client
The system SHALL provide a reusable DeepSeek API client using Node.js built-in `https` module.

#### Scenario: Successfully call DeepSeek chat
- **WHEN** the system sends a chat completion request to `https://api.deepseek.com/v1/chat/completions`
- **AND** provides a valid API key from `config.json`
- **AND** specifies model `deepseek-flash-v4`
- **THEN** the system receives and returns the response content

#### Scenario: API key not configured
- **WHEN** the system attempts to call DeepSeek API but `deepseekKey` in `config.json` is empty or missing
- **THEN** the system returns error "请先配置 DeepSeek API Key"

#### Scenario: API request timeout
- **WHEN** the DeepSeek API does not respond within 60 seconds
- **THEN** the system aborts the request and returns error "DeepSeek API 请求超时"

#### Scenario: API returns error
- **WHEN** the DeepSeek API returns a non-200 status code
- **THEN** the system returns the error message from the API response

### Requirement: Configurable temperature
The DeepSeek API client SHALL use a default temperature of 0.3 for document generation calls.

#### Scenario: Default temperature applied
- **WHEN** the system calls DeepSeek API for document generation
- **THEN** the request body includes `temperature: 0.3`

### Requirement: Structured output extraction
The system SHALL support requesting structured JSON output from DeepSeek for the change-points analysis phase.

#### Scenario: Request JSON-formatted change points
- **WHEN** the system calls DeepSeek API for change-points analysis
- **AND** instructs the model to output valid JSON
- **THEN** the system parses the response as JSON
- **AND** returns a structured array of change-point objects
