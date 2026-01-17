                                             Table "public.maintenances"
        Column        |            Type             | Collation | Nullable |                 Default                  
----------------------+-----------------------------+-----------+----------+------------------------------------------
 id                   | integer                     |           | not null | nextval('maintenances_id_seq'::regclass)
 asset_id             | integer                     |           | not null | 
 report_date          | date                        |           | not null | CURRENT_DATE
 issue_description    | text                        |           | not null | 
 vendor_name          | character varying(255)      |           |          | 
 technician_name      | character varying(255)      |           |          | 
 completion_date      | date                        |           |          | 
 cost                 | numeric(15,2)               |           |          | 0
 solution_description | text                        |           |          | 
 photo_url            | text                        |           |          | 
 status               | character varying(50)       |           | not null | 'pending'::character varying
 created_at           | timestamp without time zone |           | not null | CURRENT_TIMESTAMP
 updated_at           | timestamp without time zone |           | not null | CURRENT_TIMESTAMP
 proof_photo          | character varying(255)      |           |          | NULL::character varying
Indexes:
    "maintenances_pkey" PRIMARY KEY, btree (id)
    "maintenances_asset_id_index" btree (asset_id)
    "maintenances_status_index" btree (status)
Foreign-key constraints:
    "maintenances_asset_id_fkey" FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE

