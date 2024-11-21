const fusionIp = 'http://192.168.11.12:82/api/fusion/v1';

export const apiUrls = {
  bszUrl: 'https://11.33.4.185/vsadapter/searchface',
  sszUrl: 'https://56.4.30.164/iportal/',
  analysisImage: `${fusionIp}/common/analysisImage`,
  analysisImageClipping: `${fusionIp}/common/upload_analysis_image_clipping`,
  google: 'https://www.google.com/searchbyimage?&image_url=',
  baidu: 'https://graph.baidu.com/upload?image=',
  yitu: `${fusionIp}/comparison/image-search`,
  tineye: 'http://www.tineye.com/search/?url=',
  bing: 'https://www.bing.com/images/search?view=detailv2&iss=sbi&q=imgurl:',
  yandex:
    'https://yandex.com/images/search?source=collections&rpt=imageview&url=',
  saucenao: 'http://saucenao.com/search.php?db=999&url=',
  iqdb: 'http://iqdb.org/?url=',
  sogou: 'http://pic.sogou.com/ris?query=',
  ascii2d: 'https://ascii2d.net/search/uri',
};
