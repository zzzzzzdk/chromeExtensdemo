import React from 'react';
import { Checkbox } from 'antd';
import styled from 'styled-components';
import { regions } from '../../../constant/constants';

const CheckboxGroup = Checkbox.Group;

const ProvinceContainer = styled.div`
  .province-select {
    line-height: 32px;
    display: flex;
    align-items: baseline;

    .ant-checkbox-group {
      width: calc(100% - 60px);
    }
  }
`;

class Province extends React.Component {
  state = {
    checkedList: this.props.defaultCheckedList || [],
    indeterminate: {},
    checkAll: {},
  };

  componentDidMount() {
    // 初始化时计算 indeterminate 和 checkAll 状态
    this.setState({
      ...this.calculateIndeterminateAndCheckAll(this.state.checkedList),
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.defaultCheckedList !== this.props.defaultCheckedList) {
      this.setState({
        checkedList: this.props.defaultCheckedList,
        ...this.calculateIndeterminateAndCheckAll(
          this.props.defaultCheckedList,
        ),
      });
    }
  }

  calculateIndeterminateAndCheckAll = checkedList => {
    const indeterminate = {};
    const checkAll = {};

    regions.forEach(({ region, provinces }) => {
      const regionCheckedCount = checkedList.filter(province =>
        provinces.includes(province),
      ).length;
      indeterminate[region] =
        regionCheckedCount > 0 && regionCheckedCount < provinces.length;
      checkAll[region] = regionCheckedCount === provinces.length;
    });

    return { indeterminate, checkAll };
  };

  onChange = checkedList => {
    this.setState({
      checkedList,
      ...this.calculateIndeterminateAndCheckAll(checkedList),
    });
    if (this.props.onChange) {
      this.props.onChange(checkedList);
    }
  };

  onRegionCheckAllChange = (e, region) => {
    const { provinces } = regions.find(r => r.region === region);
    const newCheckedList = e.target.checked
      ? [...this.state.checkedList, ...provinces]
      : this.state.checkedList.filter(
          province => !provinces.includes(province),
        );

    this.setState({
      checkedList: newCheckedList,
      ...this.calculateIndeterminateAndCheckAll(newCheckedList),
    });
    if (this.props.onChange) {
      this.props.onChange(newCheckedList);
    }
  };

  render() {
    return (
      <ProvinceContainer>
        <div className="province-select-wrap">
          {regions.map(({ region, provinces }) => (
            <div key={region} className="province-select">
              <Checkbox
                indeterminate={this.state.indeterminate[region]}
                onChange={e => this.onRegionCheckAllChange(e, region)}
                checked={this.state.checkAll[region]}
                disabled={this.props.disabled}
              >
                全部
              </Checkbox>
              <CheckboxGroup
                options={provinces}
                value={this.state.checkedList.filter(province =>
                  provinces.includes(province),
                )}
                onChange={checkedList => {
                  const newCheckedList = Array.from(
                    new Set([
                      ...this.state.checkedList.filter(
                        province => !provinces.includes(province),
                      ),
                      ...checkedList,
                    ]),
                  );
                  this.onChange(newCheckedList);
                }}
                disabled={this.props.disabled}
              />
            </div>
          ))}
        </div>
      </ProvinceContainer>
    );
  }
}

export default Province;
