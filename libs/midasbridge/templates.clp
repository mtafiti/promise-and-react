
(deftemplate Touch (slot x) (slot y) (slot state) (slot dev) (slot args))
(set-default-timespan "Touch" 5000)
(deftemplate startDM (slot dev1) (slot dev2) (multislot args))
(set-default-timespan "startDM" 3000)
(deftemplate endDM (slot dev1) (slot dev2)  (slot args))
(set-default-timespan "endDM" 3000)
(deftemplate bodyDM (slot dev1) (slot dev2) (slot args))
(set-default-timespan "bodyDM" 3000)


(deftemplate bodyDM2 (slot dev1) (slot dev2) (multislot args))
(set-default-timespan "bodyDM2" 100)
(deftemplate endDM2 (slot dev1) (slot dev2) (multislot args))
(set-default-timespan "endDM2" 100)


(deftemplate Invoked (slot fn) (slot dev) (slot oid)  (slot args) (slot x) (slot y))
(set-default-timespan "Invoked" 3000)


(deftemplate Canvas (multislot bounds))

(assert (Canvas (bounds 0 0 700 575)))