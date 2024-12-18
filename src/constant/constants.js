export const BELLO_URL = 'https://ainoob.com/bello/noobox';

export const HISTORY_DB_KEY = 'history_records';

export const regions = [
  {
    region: '华北地区',
    provinces: ['北京', '天津', '河北', '山西', '内蒙'],
  },
  {
    region: '东北地区',
    provinces: ['辽宁', '吉林', '黑龙江'],
  },
  {
    region: '华东地区',
    provinces: ['上海', '江苏', '浙江', '安徽', '福建', '江西', '山东'],
  },
  {
    region: '中南地区',
    provinces: ['河南', '湖北', '湖南', '广东', '广西', '海南'],
  },
  {
    region: '西南地区',
    provinces: ['重庆', '四川', '贵州', '云南', '西藏'],
  },
  {
    region: '西北地区',
    provinces: ['陕西', '甘肃', '青海', '宁夏', '新疆'],
  },
  {
    region: '港澳台地区',
    provinces: ['香港', '澳门', '台湾'],
  },
];

export const ENGINE_DONE = {
  GOOGLE_DONE: 'googleDone',
  BAIDU_DONE: 'baiduDone',
  YITU_DONE: 'yituDone',
  // BING_DONE: 'bingDone',
  // TINEYE_DONE: 'tineyeDone',
  // YANDEX_DONE: 'yandexDone',
  // SAUCENAO_DONE: 'saucenaoDone',
  // ASCII2D_DONE: 'ascii2dDone',
  // IQDB_DONE: 'iqdb',
};
export const ENGINE_WEIGHTS = {
  google: 30,
  baidu: 28,
  yandex: 25,
  tineye: 28,
  saucenao: 10,
  iqdb: -100,
  ascii2d: -69,
  bing: 28,
};

export const AllowIps = [
  '192.168.11.12',
  'localhost',
  '127.0.0.1',
  '56.38.1.138',
  '56.38.1.136',
];
