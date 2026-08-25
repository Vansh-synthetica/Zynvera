-- =====================================================
-- REALTIME: enable live updates for communication tables
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'discussions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.discussions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'discussion_replies'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.discussion_replies;
  END IF;
END $$;
