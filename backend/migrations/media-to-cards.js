'use strict';

module.exports = {
  async up (q, Sequelize) {
    const t = await q.sequelize.transaction();
    try {
      const desc = await q.describeTable('cards');
      if (!('foto_url' in desc)) {
        await q.addColumn('cards', 'foto_url', { type: Sequelize.TEXT, allowNull: true }, { transaction: t });
      }
      if (!('youtube_video_id' in desc)) {
        await q.addColumn('cards', 'youtube_video_id', { type: Sequelize.STRING(32), allowNull: true }, { transaction: t });
      }
      if (!('youtube_start_time' in desc)) {
        await q.addColumn('cards', 'youtube_start_time', { type: Sequelize.INTEGER, allowNull: true }, { transaction: t });
      }
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },

  async down (q) {
    const t = await q.sequelize.transaction();
    try {
      const desc = await q.describeTable('cards');
      if ('youtube_start_time' in desc) await q.removeColumn('cards', 'youtube_start_time', { transaction: t });
      if ('youtube_video_id' in desc) await q.removeColumn('cards', 'youtube_video_id', { transaction: t });
      if ('foto_url' in desc) await q.removeColumn('cards', 'foto_url', { transaction: t });
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }
};
