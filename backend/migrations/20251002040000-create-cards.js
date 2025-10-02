'use strict';

module.exports = {
  async up (q, Sequelize) {
    await q.sequelize.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema='public' AND table_name='cards'
      ) THEN
        CREATE TABLE public.cards (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
          de varchar(120) NOT NULL,
          para varchar(120) NOT NULL,
          mensagem text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
      END IF;
    END $$;
    `);

    await q.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards(user_id);
    `);
  },

  async down (q) {
    await q.sequelize.query(`DROP TABLE IF EXISTS public.cards CASCADE;`);
  }
};
