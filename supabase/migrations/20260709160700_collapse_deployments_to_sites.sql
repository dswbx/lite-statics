alter table sites add column asset_count integer;
alter table sites add column total_bytes integer;
alter table sites add column manifest_json text;
alter table sites add column deployed_at timestamptz;

update sites s
set
  asset_count = d.asset_count,
  total_bytes = d.total_bytes,
  manifest_json = d.manifest_json,
  deployed_at = d.created_at
from deployments d
where s.active_deployment_id = d.id;

alter table sites drop column active_deployment_id;

drop table deployments;
