import React, { Component } from 'react';

import { Table, Select } from '@grafana/ui';
import { FieldMatcherID, PanelProps, DataFrame, SelectableValue } from '@grafana/data';
import { Options } from './types';
import { css } from 'emotion';
import { config } from 'app/core/config';

interface Props extends PanelProps<Options> {}

export class TablePanel extends Component<Props> {
  constructor(props: Props) {
    super(props);
  }

  onColumnResize = (fieldIndex: number, width: number) => {
    const { fieldConfig, data } = this.props;
    const { overrides } = fieldConfig;
    const frame = data.series[this.getCurrentFrameIndex()];

    if (!frame) {
      return;
    }

    const field = frame.fields[fieldIndex];
    if (!field) {
      return;
    }

    const fieldName = field.name;
    const matcherId = FieldMatcherID.byName;
    const propId = 'custom.width';

    // look for existing override
    const override = overrides.find(o => o.matcher.id === matcherId && o.matcher.options === fieldName);

    if (override) {
      // look for existing property
      const property = override.properties.find(prop => prop.id === propId);
      if (property) {
        property.value = width;
      } else {
        override.properties.push({ id: propId, value: width });
      }
    } else {
      overrides.push({
        matcher: { id: matcherId, options: fieldName },
        properties: [{ id: propId, value: width }],
      });
    }

    this.props.onFieldConfigChange({
      ...fieldConfig,
      overrides,
    });
  };

  onChangeTableSelection = (val: SelectableValue<number>) => {
    this.props.onOptionsChange({
      ...this.props.options,
      frameIndex: val.value || 0,
    });

    // Force a redraw -- but no need to re-query
    this.forceUpdate();
  };

  renderTable(frame: DataFrame, width: number, height: number) {
    const { options } = this.props;

    return (
      <Table
        height={height}
        width={width}
        data={frame}
        noHeader={!options.showHeader}
        resizable={true}
        onColumnResize={this.onColumnResize}
      />
    );
  }

  getCurrentFrameIndex() {
    const { data, options } = this.props;
    const count = data.series?.length;
    return options.frameIndex > 0 && options.frameIndex < count ? options.frameIndex : 0;
  }

  render() {
    const { data, height, width } = this.props;

    const count = data.series?.length;

    if (!count || count < 1) {
      return <div>No data</div>;
    }

    if (count > 1) {
      const inputHeight = config.theme.spacing.formInputHeight;
      const padding = 8 * 2;
      const currentIndex = this.getCurrentFrameIndex();
      const names = data.series.map((frame, index) => {
        return {
          label: `${frame.name ?? 'Series'}`,
          value: index,
        };
      });

      return (
        <div className={tableStyles.wrapper}>
          {this.renderTable(data.series[currentIndex], width, height - inputHeight - padding)}
          <div className={tableStyles.selectWrapper}>
            <Select options={names} value={names[currentIndex]} onChange={this.onChangeTableSelection} />
          </div>
        </div>
      );
    }

    return this.renderTable(data.series[0], width, height - 12);
  }
}

const tableStyles = {
  wrapper: css`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
  `,
  selectWrapper: css`
    padding: 8px;
  `,
};
