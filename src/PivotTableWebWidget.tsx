import { Component, ReactNode, createElement } from "react";
import { PivotTableWebWidgetContainerProps } from "../typings/PivotTableWebWidgetProps";

import "./ui/PivotTableWebWidget.css";

export default class PivotTableWebWidget extends Component<PivotTableWebWidgetContainerProps> {

    constructor(props: PivotTableWebWidgetContainerProps) {
        super(props);
        this.state = {
            tableData : {
                xKeyArray : []
            }
        };
    }

    render(): ReactNode {
        const { ds, yIdAttr } = this.props;
        if (!ds || !ds.items || !yIdAttr) {
            return null;
        }
        return <ul>
            {ds.items.map((item) => <li id={item.id}>{yIdAttr(item).displayValue}</li>)}
        </ul>;
    }
}
