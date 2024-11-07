import React from 'react';
import styled from 'styled-components';
import FAIcon from '@fortawesome/react-fontawesome';
import faSolid from '@fortawesome/fontawesome-free-solid';
import { Row, Col, Card, Icon, Popover, Avatar, Modal } from 'antd';
import { engineIcon } from 'SRC/constant/settingMap.js';
import Loader from 'SRC/common/component/Loader.jsx';
import ImageLost from 'SRC/assets/fun/error.png';
import nodata from 'SRC/assets/fun/no-data.png'
const ResultContainer = styled.div`
  background:white;
  border: 1px solid #e8e8e8;
  #dogeLoading{
    display: block;
    margin-left: auto;
    margin-right: auto;
    width: 50%;
  }
  .cardMetaWrapper{
    position: absolute;
    left: 4px;
    bottom: 6px;
  }
  .ant-card-body{
    padding: 30px;
  }
  .ant-avatar{
    opacity: 0.5
  }
  .ant-avatar:hover{
    opacity:0.8
    transition: opacity .25s ease-in-out;
  }
  .nodata {
    display: flex;
    justify-content: center;
    padding: 20px 0;
  }
`;
const popoverContent = {
  maxWidth: '256px',
  margin: 0,
};
export default class ImageWall extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      imageUrl: '',
    };
  }
  showModal(sourceUrl) {
    this.setState({
      showModal: true,
      imageUrl: sourceUrl,
    });
  }
  hideModal() {
    this.setState({
      showModal: false,
    });
  }
  imgError(e) {
    console.log(ImageLost)
    e.target.src = ImageLost;
  }
  generateCardList(imageDataList) {
    const eachRowNumber = 6;
    //span = 24/eachRow
    let count = 0;
    let eachRowCount = 0;
    let container = [[], [], [], [], [], []];
    while (count < imageDataList.length) {
      while (count < imageDataList.length && eachRowCount < eachRowNumber) {
        let item = imageDataList[count];
        let thatCol = container[eachRowCount];
        thatCol[thatCol.length] = (
          <div key={count}>
            <Card
              hoverable={true}
              style={{ width: '100%', minHeight: 60 }}
              cover={
                <img
                  alt="Image Is Dead, Sorry"
                  src={item.targetImage}
                  onError={e => this.imgError(e)}
                  onClick={() => this.showModal(item.bigImage)}
                />
              }
            >
              <div className="cardMetaWrapper">
                <Card.Meta
                  title={item.similarity + "%"}
                  description={item.targetType}
                />
              </div>
            </Card>
          </div>
        );
        count++;
        eachRowCount++;
      }
      eachRowCount = 0;
    }
    return container;
  }
  render() {
    let { imageDataList } = this.props;
    if (imageDataList.length > 0) {
      let imageWall = this.generateCardList(imageDataList);
      return (
        <ResultContainer>
          <Row>
            {imageWall.map((item, index) => {
              return (
                <Col key={index} span={4}>
                  {item}
                </Col>
              );
            })}
          </Row>
          <Modal
            visible={this.state.showModal}
            footer={null}
            onCancel={() => this.hideModal()}
          >
            <img
              alt="Image Down Sorry"
              style={{ width: '100%' }}
              src={this.state.imageUrl}
              onError={e => this.imgError(e)}
            />
          </Modal>
        </ResultContainer>
      );
    } else {
      return (
        <ResultContainer>
          {/* <Loader style={{ marginTop: '5%' }} /> */}
          <div className="nodata">
            <img src={nodata} alt="暂无数据" />
          </div>
        </ResultContainer>
      );
    }
  }
}
