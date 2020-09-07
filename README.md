## PivotTableWebWidget
Pivot table widget

## Features
- Use a datasource or a REST service call for the data.
- Values and labels for the X and Y axis are attributes of the entity.
- Perform actions on the data in each cell.
- React to click events on the cells.
- Apply styling thresholds to highlight certain values
- Export the table data as CSV
- When there is no data, no table will be rendered but a (configurable) text will be shown.

## Entity to use
Because non persistent entities are kept in the client state, these are not the preferred way when using a datasource. It is best to use persistent entities and make sure the objects are committed.

However, existing implementations of this widget probably use non-persistent entities because that was the preferred way for Mendix 4 thru 6.

Especially when using non-persistent entities it is best to use a web service rather than a datasource because the web service does not return Mendix objects but only JSON data.

## Usage
[step by step instructions]

## Web service

### Authorization
Make sure that current session is (also) allowed for the web service because the widget will not try to authenticate.
The service should return a list of data items in the following format:

| Element     | Req.? | Description |
|-------------|:-:|--|
| idValueX    | Y | ID value for the X axis |
| labelValueX |   | Label value for the X axis, ID value will be used if empty |
| idValueY    | Y | ID value for the Y axis |
| labelValueY |   | Label value for the Y axis, ID value will be used if empty |
| value       | ? | Value, required when Cell value action is not Count |



## Demo project
https://testpivottablewebw-sandbox.mxapps.io/

## Issues, suggestions and feature requests
https://github.com/Itvisors/mendix-PivotTableWebWidget/issues
