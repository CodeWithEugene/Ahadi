!(import! &self (library Omega ./plugins/demoplugin/demoplugin.py))
!(import! &self (library Omega ./plugins/demoplugin/rules))

(= (loadOmegaPlugin)
   (progn
     (add-skill pubmed-search "Search PubMed (stub) and return top titles" (query))
     (add-skill risk-check "Apply the clinic's NAL rule base to a patient; returns truth value" (patient))
     ()))

(= (pubmed-search $q)
   (py-call (demoplugin.pubmed_search $q)))

(= (risk-check $p)
   (let $sym (py-call (demoplugin.to_symbol $p))
     (repr (|- ((--> $sym hypertensive) (stv 1.0 0.9)) (rule-hypertensive-at-risk)))))
