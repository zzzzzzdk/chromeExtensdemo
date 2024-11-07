import { isOptionOn, getDB, setDB, deleteDB } from '../utils/db';
import { HISTORY_DB_KEY } from '../constant/constants';

export default class History {
  constructor() {}
  async recordImageSearch(cursor, info) {
    get('totalImageSearch', data => {
      data = data || 0;
      set('totalImageSearch', parseInt(data) + 1);
    });
    if (isOptionOn('history')) {
      let records = await getDB(HISTORY_DB_KEY);
      records = records || [];
      const source = info.srcUrl || info;
      records.push({
        date: new Date().getTime(),
        event: 'search',
        cursor,
        info: source,
      });
      await setDB(HISTORY_DB_KEY, records);
    }
  }
  async cleanupRelatedDB(record) {
    switch (record.event) {
      case 'search':
        const id = record.cursor;
        await deleteDB('NooBox.Image.result_' + id);
        break;
    }
  }
  async deleteHistory(i) {
    const recordList = await getDB(HISTORY_DB_KEY);
    History.cleanupRelatedDB(recordList[i]);
    recordList.splice(i, 1);
    await setDB(HISTORY_DB_KEY, recordList);
  }
  async clearHistory() {
    const recordList = await getDB(HISTORY_DB_KEY);
    for (let i = 0; i < recordList.length; i++) {
      History.cleanupRelatedDB(recordList[i]);
    }
    deleteDB(HISTORY_DB_KEY, () => {
      this.setState({ recordList: null });
    });
  }
}
