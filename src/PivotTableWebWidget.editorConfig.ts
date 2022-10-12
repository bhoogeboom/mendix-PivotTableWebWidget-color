import { PivotTableWebWidgetPreviewProps } from "../typings/PivotTableWebWidgetProps";
import { hidePropertyIn, hidePropertiesIn } from "@mendix/pluggable-widgets-tools";

export type Platform = "web" | "desktop";

export type Properties = PropertyGroup[];

type PropertyGroup = {
    caption: string;
    propertyGroups?: PropertyGroup[];
    properties?: Property[];
};

type Property = {
    key: string;
    caption: string;
    description?: string;
    objectHeaders?: string[]; // used for customizing object grids
    objects?: ObjectProperties[];
    properties?: Properties[];
};

type ObjectProperties = {
    properties: PropertyGroup[];
    captions?: string[]; // used for customizing object grids
};

export type Problem = {
    property?: string; // key of the property, at which the problem exists
    severity?: "error" | "warning" | "deprecation"; // default = "error"
    message: string; // description of the problem
    studioMessage?: string; // studio-specific message, defaults to message
    url?: string; // link with more information about the problem
    studioUrl?: string; // studio-specific link
};

type BaseProps = {
    type: "Image" | "Container" | "RowLayout" | "Text" | "DropZone" | "Selectable" | "Datasource";
    grow?: number; // optionally sets a growth factor if used in a layout (default = 1)
};

type ImageProps = BaseProps & {
    type: "Image";
    document?: string; // svg image
    data?: string; // base64 image
    property?: object; // widget image property object from Values API
    width?: number; // sets a fixed maximum width
    height?: number; // sets a fixed maximum height
};

type ContainerProps = BaseProps & {
    type: "Container" | "RowLayout";
    children: PreviewProps[]; // any other preview element
    borders?: boolean; // sets borders around the layout to visually group its children
    borderRadius?: number; // integer. Can be used to create rounded borders
    backgroundColor?: string; // HTML color, formatted #RRGGBB
    borderWidth?: number; // sets the border width
    padding?: number; // integer. adds padding around the container
};

type RowLayoutProps = ContainerProps & {
    type: "RowLayout";
    columnSize?: "fixed" | "grow"; // default is fixed
};

type TextProps = BaseProps & {
    type: "Text";
    content: string; // text that should be shown
    fontSize?: number; // sets the font size
    fontColor?: string; // HTML color, formatted #RRGGBB
    bold?: boolean;
    italic?: boolean;
};

type DropZoneProps = BaseProps & {
    type: "DropZone";
    property: object; // widgets property object from Values API
};

type SelectableProps = BaseProps & {
    type: "Selectable";
    object: object; // object property instance from the Value API
    child: PreviewProps; // any type of preview property to visualize the object instance
};

type DatasourceProps = BaseProps & {
    type: "Datasource";
    property: object | null; // datasource property object from Values API
    child?: PreviewProps; // any type of preview property component (optional)
};

export type PreviewProps = ImageProps | ContainerProps | RowLayoutProps | TextProps | DropZoneProps | SelectableProps | DatasourceProps;

export function getProperties(values: PivotTableWebWidgetPreviewProps, defaultProperties: Properties /* , target: Platform*/): Properties {
    // Do the values manipulation here to control the visibility of properties in Studio and Studio Pro conditionally.

    // Hide attribute related properties for count as no attribute value is used.
    if (values.cellValueAction === "count") {
        hidePropertiesIn(defaultProperties, values, ["precisionForAverage", "precisionForNumbers", "cellValueDateformat", "cellValueAttr"]);
    }

    // Hide precision for average if no average requested
    if (values.cellValueAction !== "average") {
        hidePropertyIn(defaultProperties, values, "precisionForAverage");
    }

    // Hide total column label if not applicable
    if (!values.showTotalColumn) {
        hidePropertyIn(defaultProperties, values, "totalColumnLabel");
    }

    // Hide total row label if not applicable
    if (!values.showTotalRow) {
        hidePropertyIn(defaultProperties, values, "totalRowLabel");
    }

    // Hide onClick properties if no action configured
    if (!values.onClickAction) {
        hidePropertiesIn(defaultProperties, values, ["onCellClickXIdAttr", "onCellClickYIdAttr"]);
    }

    // Hide export properties if export not allowed
    if (!values.allowExport) {
        hidePropertiesIn(defaultProperties, values, [
            "exportButtonCaption",
            "exportButtonClass",
            "exportFilenamePrefix",
            "exportFilenameDateformat",
            "exportDataAttr",
            "exportFilenameAttr",
            "exportAction"
        ]);
    }

    return defaultProperties;
}

export function check(values: PivotTableWebWidgetPreviewProps): Problem[] {
    switch (values.dataSourceType) {
        case "datasource":
            return checkDatasourceProps(values);

        case "serviceCall":
            return checkServiceProps(values);

        default:
            return [];
    }
}

function checkCommonProps(values: PivotTableWebWidgetPreviewProps): Problem[] {
    const errors: Problem[] = [];
    const { cellValueAction, showTotalColumn, showTotalRow, conditionalStylingList } = values;

    // Check whether total row/column is allowed
    if (cellValueAction !== "count" && cellValueAction !== "sum") {
        // Total row/column only allowed for count and sum
        if (showTotalColumn) {
            errors.push({
                property: "showTotalColumn",
                message: "Total column is only supported for count and sum"
            });
        }
        if (showTotalRow) {
            errors.push({
                property: "showTotalRow",
                message: "Total row is only supported for count and sum"
            });
        }
    }

    if (cellValueAction === "display" && conditionalStylingList.length > 0) {
        errors.push({
            property: "cellValueAction",
            message: "Conditional styling is not allowed for action Display"
        });
    }

    const { onClickAction, onCellClickXIdAttr, onCellClickYIdAttr } = values;

    if (onClickAction) {
        if (!onCellClickXIdAttr) {
            errors.push({
                property: "onCellClickXIdAttr",
                message: "On click X-axis ID attribute is required when On click action is configured"
            });
        }
        if (!onCellClickYIdAttr) {
            errors.push({
                property: "onCellClickYIdAttr",
                message: "On click Y-axis ID attribute is required when On click action is configured"
            });
        }
    }

    const { allowExport, exportDataAttr, exportFilenameAttr, exportAction } = values;

    if (allowExport) {
        if (!exportDataAttr) {
            errors.push({
                property: "exportDataAttr",
                message: "Export data attribute is required when export is allowed"
            });
        }
        if (!exportFilenameAttr) {
            errors.push({
                property: "exportFilenameAttr",
                message: "Export file name attribute is required when export is allowed"
            });
        }
        if (!exportAction) {
            errors.push({
                property: "exportAction",
                message: "Export action is required when export is allowed"
            });
        }
    }

    return errors;
}

function checkDatasourceProps(values: PivotTableWebWidgetPreviewProps): Problem[] {
    const errors = checkCommonProps(values);
    const { ds, cellValueAction, cellValueAttr, xIdAttr, xLabelAttr, xSortAttr, yIdAttr, yLabelAttr, ySortAttr } = values;

    if (!ds) {
        errors.push({
            property: "ds",
            message: "Datasource not configured"
        });
    }
    if (!cellValueAttr && cellValueAction !== "count") {
        errors.push({
            property: "cellValueAttr",
            message: "Cell value not set"
        });
    }
    if (!xIdAttr) {
        errors.push({
            property: "xIdAttr",
            message: "X-axis ID not set"
        });
    }
    if (!yIdAttr) {
        errors.push({
            property: "yIdAttr",
            message: "Y-axis ID not set"
        });
    }
    if (xSortAttr === "label") {
        if (!xLabelAttr) {
            errors.push({
                property: "xLabelAttr",
                message: "X-axis label not set and sort is by label. Sort by ID or set a label attribute"
            });
        }
    }
    if (ySortAttr === "label") {
        if (!yLabelAttr) {
            errors.push({
                property: "yLabelAttr",
                message: "Y-axis label not set and sort is by label. Sort by ID or set a label attribute"
            });
        }
    }

    return errors;
}

function checkServiceProps(values: PivotTableWebWidgetPreviewProps): Problem[] {
    const errors = checkCommonProps(values);
    const { dataChangeDateAttr, serviceUrl } = values;

    if (!serviceUrl) {
        errors.push({
            property: "serviceUrl",
            message: "Service URL not set"
        });
    }

    if (!dataChangeDateAttr) {
        errors.push({
            property: "dataChangeDateAttr",
            message: "Data changed date attribute not set"
        });
    }

    return errors;
}

// export function getPreview(values: EmptyWebTsPreviewProps, isDarkMode: boolean): PreviewProps {
//     // Customize your pluggable widget appearance for Studio Pro.
//     return {
//         type: "Container",
//         children: []
//     }
// }

// export function getCustomCaption(values: EmptyWebTsPreviewProps, platform: Platform): string {
//     return "EmptyWebTs";
// }
