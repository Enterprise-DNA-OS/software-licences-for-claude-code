do $$
declare cad uuid; cad2 uuid; editor uuid; server_app uuid; d1 uuid; d2 uuid; d3 uuid; u1 uuid; u2 uuid;
begin
if exists(select 1 from applications where name='HarbourCAD Professional 2026') then return; end if;
insert into applications(name,publisher,metric,terms_source,reviewed_by,reviewed_on) values ('HarbourCAD Professional 2026','Fictional Harbour Software','device','DEMO agreement HC-2026: one licence per device','Demo licence reviewer',current_date-15) returning id into cad;
insert into applications(name,publisher,metric,terms_source,reviewed_by,reviewed_on) values ('HarbourCAD Viewer 2026','Fictional Harbour Software','device','DEMO agreement HV-2026: one licence per device','Demo licence reviewer',current_date-15) returning id into cad2;
insert into applications(name,publisher,metric,terms_source,reviewed_by,reviewed_on) values ('Kauri Documents 2026','Fictional Kauri Software','user','DEMO agreement KD-2026: named-user assignments','Demo licence reviewer',current_date-15) returning id into editor;
insert into applications(name,publisher,notes) values ('Southern Database Enterprise','Fictional Southern Systems','Core and virtualisation terms have not been assessed') returning id into server_app;
insert into consumers(name,kind,department,last_seen) values ('AKL-DESIGN-01','device','Design',current_date-2) returning id into d1;
insert into consumers(name,kind,department,last_seen) values ('AKL-DESIGN-02','device','Design',current_date-65) returning id into d2;
insert into consumers(name,kind,department,state,last_seen) values ('WLG-OPS-03','device','Operations','retired',current_date-100) returning id into d3;
insert into consumers(name,kind,department,last_seen) values ('mia.demo','user','Design',current_date-1) returning id into u1;
insert into consumers(name,kind,department,state,last_seen) values ('leo.demo','user','Operations','retired',current_date-110) returning id into u2;
insert into entitlements(reference,application_id,metric,quantity,starts_on,ends_on,evidence_ref,verified_by) values
('PO-DEMO-101',cad,'device',1,current_date-200,current_date+20,'DEMO: invoice 101 and agreement HC-2026','Demo licence reviewer'),
('PO-DEMO-102',cad,'device',2,current_date-50,null,null,null),
('PO-DEMO-103',editor,'user',3,current_date-300,current_date+45,'DEMO: invoice 103 and agreement KD-2026','Demo licence reviewer'),
('PO-DEMO-104',cad2,'device',2,current_date-400,null,'DEMO: perpetual grant HV-2026','Demo licence reviewer'),
('PO-DEMO-105',server_app,'review',16,current_date-400,current_date-12,'DEMO: server licence document awaiting specialist','Demo reviewer');
insert into deployments(application_id,consumer_id,observed_on,last_used) values
(cad,d1,current_date-2,current_date-2),(cad,d2,current_date-65,current_date-120),(cad,d3,current_date-100,current_date-140),
(cad2,d1,current_date-2,null),(editor,u1,current_date-1,current_date-1),(editor,u2,current_date-110,current_date-130),
(server_app,d1,current_date-2,null);
insert into events(application_id,actor,action,detail) values (cad,'Demo licence reviewer','note','{"note":"Purchase proof requested for PO-DEMO-102. No rights inferred from payment alone."}');
end $$;
