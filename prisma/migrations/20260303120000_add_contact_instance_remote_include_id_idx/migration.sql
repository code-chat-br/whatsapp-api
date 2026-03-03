CREATE INDEX IF NOT EXISTS "Contact_instanceId_remoteJid_inc_id_idx"
ON public."Contact" ("instanceId", "remoteJid")
INCLUDE (id);