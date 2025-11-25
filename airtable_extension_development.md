# Airtable Extension Development Guide

This document compiles information from the Airtable Blocks SDK API Reference and Extensions Guides to help you develop Airtable extensions.

---

## API Reference Highlights

The API Reference provides detailed information on the Airtable Blocks SDK. Key interfaces and models include:

### Aggregator
Used to compute aggregates for cell values.
- `displayName`: User-friendly name.
- `key`: Unique key for identification.
- `shortDisplayName`: Short user-friendly name.
- `aggregate(records: Array<Record>, field: Field)`: Aggregates field values.
- `aggregateToString(records: Array<Record>, field: Field)`: Aggregates and formats as string.

### Base
Represents an Airtable base.
- `activeCollaborators`: Users with access to the base.
- `color`: Color of the base.
- `id`: ID of the base.
- `isDeleted`: True if the base has been deleted.
- `name`: Name of the base.
- `tables`: Tables in this base.
- `workspaceId`: Workspace ID of the base.
- `checkPermissionsForCreateTable(name, fields)`: Checks permission to create a table.
- `createTableAsync(name, fields)`: Creates a new table.

### Cursor
Contains information about the user's current interactions in Airtable.
- `activeTableId`: Currently active table ID.
- `activeViewId`: Currently active view ID.
- `id`: ID for this model.
- `isDataLoaded`: Boolean indicating if data is loaded.
- `isDeleted`: Boolean indicating if deleted.
- `selectedFieldIds`: Field IDs of selected fields.
- `selectedRecordIds`: Record IDs of selected records.
- `isRecordSelected(recordOrRecordId)`: Checks if a record is selected.
- `loadDataAsync()`: Fetches and retains async data.
- `setActiveTable(tableOrTableId)`: Sets the active table.
- `setActiveView(tableOrTableId, viewOrViewId)`: Sets the active view.
- `unloadData()`: Unloads data.

### Field
Represents a field in a table.
- `availableAggregators`: List of available aggregators for this field.
- `config`: Type and options of the field.
- `description`: Description of the field.
- `id`: ID of the field.
- `isComputed`: True if the field is computed.
- `isDeleted`: True if the field has been deleted.
- `isPrimaryField`: True if the field is the primary field.
- `name`: Name of the field.
- `options`: Configuration options of the field.
- `type`: Type of the field.
- `checkPermissionsForUpdateDescription(description)`: Checks permission to update description.
- `checkPermissionsForUpdateName(name)`: Checks permission to update name.
- `checkPermissionsForUpdateOptions(options)`: Checks permission to update options.
- `convertStringToCellValue(string)`: Parses a string to a cell value.
- `updateDescriptionAsync(description)`: Updates the description.
- `updateNameAsync(name)`: Updates the name.
- `updateOptionsAsync(options)`: Updates the options.
- `isAggregatorAvailable(aggregator)`: Checks if an aggregator is available.

### GlobalConfig
A key-value store for persisting configuration options for an extension installation.
- `checkPermissionsForSet(key, value)`: Checks permission to set a global config key.
- `checkPermissionsForSetPaths(updates)`: Checks permission to perform specified updates.
- `get(key)`: Gets the value at a path.
- `hasPermissionToSet(key, value)`: Alias for `checkPermissionsForSet().hasPermission`.
- `hasPermissionToSetPaths(updates)`: Alias for `checkPermissionsForSetPaths().hasPermission`.
- `setAsync(key, value)`: Sets a value at a path.
- `setPathsAsync(updates)`: Sets multiple values.

### Record
Represents a record in a table.
- `commentCount`: Number of comments on this record.
- `createdTime`: Creation date of this record.
- `id`: ID of the record.
- `isDeleted`: True if the record has been deleted.
- `name`: Primary cell value in this record.
- `url`: URL for the record.
- `getAttachmentClientUrlFromCellValueUrl(attachmentId, attachmentUrl)`: Returns a URL for rendering an attachment.
- `getCellValue(fieldOrFieldIdOrFieldName)`: Gets the cell value.
- `getCellValueAsString(fieldOrFieldIdOrFieldName)`: Gets the cell value as a string.
- `getColorHexInView(viewOrViewIdOrViewName)`: Gets the CSS hex string for record color in a view.
- `getColorInView(viewOrViewIdOrViewName)`: Gets the color of the record in a view.
- `selectLinkedRecordsFromCell(fieldOrFieldIdOrFieldName, opts)`: Selects linked records.
- `selectLinkedRecordsFromCellAsync(fieldOrFieldIdOrFieldName, opts)`: Selects and loads linked records.

### Session
Represents the current user's session.
- `currentUser`: The current user.
- `id`: ID of the session.
- `checkPermissionsForCreateRecords()`: Checks permission to create records.
- `checkPermissionsForDeleteRecords()`: Checks permission to delete records.
- `checkPermissionsForUpdateRecords()`: Checks permission to update records.
- `hasPermissionToCreateRecords()`: Alias for `checkPermissionsForCreateRecords().hasPermission`.
- `hasPermissionToDeleteRecords()`: Alias for `checkPermissionsForDeleteRecords().hasPermission`.
- `hasPermissionToUpdateRecords()`: Alias for `checkPermissionsForUpdateRecords().hasPermission`.

### SettingsButton
Interface to the settings button.
- `isVisible`: Whether the settings button is being shown.
- `hide()`: Hides the settings button.
- `show()`: Shows the settings button.

### Table
Represents a table.
- `description`: Description of the table.
- `fields`: Fields in this table.
- `id`: ID of the table.
- `isDeleted`: True if the table has been deleted.
- `name`: Name of the table.
- `primaryField`: The table's primary field.
- `url`: URL for the table.
- `views`: Views in this table.
- `checkPermissionsForCreateField(name, type, options, description)`: Checks permission to create a field.
- `checkPermissionsForCreateRecord(fields)`: Checks permission to create a record.
- `checkPermissionsForCreateRecords(records)`: Checks permission to create multiple records.
- `checkPermissionsForDeleteRecord(recordOrRecordId)`: Checks permission to delete a record.
- `checkPermissionsForDeleteRecords(recordsOrRecordIds)`: Checks permission to delete multiple records.
- `checkPermissionsForUpdateRecord(recordOrRecordId, fields)`: Checks permission to update a record.
- `checkPermissionsForUpdateRecords(records)`: Checks permission to update multiple records.
- `createFieldAsync(name, type, options, description)`: Creates a new field.
- `createRecordAsync(fields)`: Creates a new record.
- `createRecordsAsync(records)`: Creates multiple records.
- `deleteRecordAsync(recordOrRecordId)`: Deletes a record.
- `deleteRecordsAsync(recordsOrRecordIds)`: Deletes multiple records.
- `getField(fieldIdOrName)`: Gets a field by ID or name.
- `getFieldById(fieldId)`: Gets a field by ID.
- `getFieldByIdIfExists(fieldId)`: Gets a field by ID if it exists.
- `getFieldByName(fieldName)`: Gets a field by name.
- `getFieldByNameIfExists(fieldName)`: Gets a field by name if it exists.
- `getFieldIfExists(fieldIdOrName)`: Gets a field by ID or name if it exists.
- `getFirstViewOfType(allowedViewTypes, preferredViewOrViewId)`: Returns the first view of a given type.
- `getView(viewIdOrName)`: Gets a view by ID or name.
- `getViewById(viewId)`: Gets a view by ID.
- `getViewByIdIfExists(viewId)`: Gets a view by ID if it exists.
- `getViewByName(viewName)`: Gets a view by name.
- `getViewByNameIfExists(viewName)`: Gets a view by name if it exists.
- `getViewIfExists(viewIdOrName)`: Gets a view by ID or name if it exists.
- `selectRecords(opts)`: Selects records from the table.
- `selectRecordsAsync(opts)`: Selects and loads records from the table.
- `updateRecordAsync(recordOrRecordId, fields)`: Updates cell values for a record.
- `updateRecordsAsync(records)`: Updates cell values for multiple records.

### View
Represents an Airtable view.
- `id`: ID of the view.
- `isDeleted`: True if the view has been deleted.
- `isLockedView`: True if the view is locked.
- `name`: Name of the view.
- `type`: Type of the view.
- `url`: URL for the view.
- `selectMetadata()`: Selects field order and visible fields.
- `selectMetadataAsync()`: Selects and loads field order and visible fields.
- `selectRecords(opts)`: Selects records from the view.
- `selectRecordsAsync(opts)`: Selects and loads records from the view.

### Viewport
Information about the current viewport.
- `isFullscreen`: True if the extension is fullscreen.
- `isSmallerThanMinSize`: True if the extension frame is smaller than minSize.
- `maxFullscreenSize`: Maximum dimensions of the extension in fullscreen mode.
- `minSize`: Minimum dimensions of the extension.
- `size`: Current size of the extension frame.
- `addMaxFullscreenSize(sizeConstraint)`: Adds a maximum fullscreen size constraint.
- `addMinSize(sizeConstraint)`: Adds a minimum frame size constraint.
- `enterFullscreenIfPossible()`: Requests to enter fullscreen mode.
- `exitFullscreen()`: Requests to exit fullscreen mode.

---

## Extensions Guides Highlights

This section summarizes key aspects of Airtable extension development.

### Getting Started
- **Prerequisites**: Familiarity with Airtable, JavaScript, React (function components and hooks), terminal usage, Node.js (v12+), and a text editor (e.g., VS Code).
- **Running Commands**: Commands in the terminal are prefixed with `$`.

### Building Your First "Hello, World" Extension
1.  **Set up a new Airtable base**: Create a new base or use an existing one (Pro or Enterprise workspace required for extensions).
2.  **Create a new extension**:
    -   Open Extensions dashboard -> "Install an extension" -> "Build a custom extension".
    -   Give your extension a name.
    -   Follow on-screen instructions to install Airtable Blocks CLI (`npm install -g @airtable/blocks-cli`).
    -   Set your API key (`block set-api-key <YOUR API KEY>`).
    -   Run `block init` to install dependencies.
    -   Run `block run` to start the development server.
    -   Paste the localhost URL (`http://localhost:9000`) into Airtable's "From URL" option.
3.  **Making changes**: Edit `frontend/index.js`. Changes will automatically refresh in the browser.

### Releasing Your Extension
-   To release your extension, run `block release`. This builds the extension for production and uploads it to Airtable's servers.

### Working with Hooks
-   Airtable Blocks SDK provides React hooks for interacting with base data:
    -   `useBase`: Connects to the base's schema, re-renders on schema changes.
    -   `useRecords`, `useRecordIds`, `useRecordById`: For working with record data.
    -   `useViewMetadata`: For view metadata (e.g., visible fields).
    -   `useSession`: For current user's session information.
    -   `useViewport`: For viewport size and fullscreen status.
    -   `useSettingsButton`: For the settings button outside the extension's viewport.
    -   `useWatchable`: Low-level hook for granular control over data changes.
-   **Handling Deletion**: Use `IfExists()` variants (e.g., `base.getTableByNameIfExists()`) to prevent crashes if models are deleted.
-   **Conditional Hooks**: Hooks cannot be called conditionally. Conditionally render inner components that use hooks.
-   **Class Components**: Wrap class components in function components to use hooks.

### Advanced Controls
-   **`useLoadable`**: Handles asynchronous data loading and unloading, uses React Suspense for loading indicators.
-   **`useWatchable`**: Watches `Watchable` models and triggers re-renders. Allows watching specific keys for fine-grained control.
-   **Data Loading**:
    -   **Loaded by default**: Base schema (name, tables, views, fields, collaborators), session information, cursor information.
    -   **Not loaded by default**: Records, view metadata (field order, visible fields), cursor information for selected records and fields. These require `useLoadable` or higher-level hooks.
-   **Manual Loading/Watching**: Use `loadDataAsync()` and `unloadData()` for manual control. Use `watch()` and `unwatch()` for subscriptions.

### Write Back to Airtable
-   Extensions can create, update, and delete records.
-   **Permissions**: Use `checkPermissionsFor[Action]` helpers (e.g., `table.checkPermissionsForUpdateRecord()`) and `hasPermissionTo` variants to check user permissions before performing write operations.
-   **Asynchronous Updates**: All write methods are asynchronous and return a Promise. Updates are optimistically applied locally and then persisted to Airtable servers.
-   **Size Limits & Rate Limits**:
    -   Batch methods (e.g., `updateRecordsAsync`) are limited to 50 records per call.
    -   `globalConfig.setPathsAsync` is limited to 50 paths per call.
    -   Individual writes cannot exceed 1.9MB payload size.
    -   Rate-limited to 15 writes per second.
-   **Updating Specific Field Types**: Refer to the API reference for `FieldType` for accepted cell write formats. Array-type fields require setting a new array of items.

### Changing Base Schema
-   **Create New Fields**: Use `Table.createFieldAsync(name, type, options, description)`.
-   **Update Existing Fields**: Use `Field.updateOptionsAsync()`.
-   **Create New Tables**: Use `Base.createTableAsync(name, fields)`.
-   **Usage**: Built-in permission check helpers (`checkPermissionsFor[Action]` and `hasPermissionTo[Action]`) are available.

---

This guide provides a comprehensive overview for developing Airtable extensions, covering both API functionalities and practical development steps.
