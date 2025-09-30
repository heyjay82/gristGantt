
/* GRIST **************************************************************************************************/

grist.ready({ 
  requiredAccess: 'full',
  //columns: ['Debut', 'NbJours', 'TaskName', 'Couleur']
  columns: [
    {
      name: "Debut",
      optional: false, 
      type: "Date",
      description: "Début de la tâche" 
    },
    {
      name: "NbJours",
      optional: false, 
      type: "Numeric",
      description: "Durée de la tâche en jours " 
    },
    {
      name: "TaskName",
      optional: false, 
      type: "Any",
      description: "Contenu à afficher dans la barre" 
    },
    {
      name: "Couleur",
      optional: true, 
      type: "Text",
      description: "blue|red|green|orange|purple|yellow|pink|cyan|teal|gray"
    },
    {
      name: "Legende",
      optional: true, 
      type: "Any",
      description: "Légende à afficher dans la bannière" 
    },
    {
      name: "Commentaire",
      optional: true, 
      type: "Any",
      description: "" 
    },
  ]
});

grist.onRecords(table => {

  mappedTable = grist.mapColumnNames(table);
  console.log(mappedTable);
  
  document.querySelector("#gantt-header").classList.remove('changed');
  document.querySelector("#updateBtn").classList.add('btnDisabled');

  let tasks = [];
  let modif = [];
  let legends = []; //Mémorise les légendes déjà inscrites pour ne pas les dupliquer 

  //Construction du tableau Gantt
  document.querySelector("#legend").innerHTML = "";
  mappedTable.forEach((e) => {
    tasks.push( 
      {
        id: e.id,
        name: e.TaskName,
        start: e.Debut,
        end: addDays(e.Debut, e.NbJours), //e.Fin,
        progress: 0,
        custom_class: 'bar-' + e.Couleur,
        comment: e.Commentaire,
        legend: e.Legende
      });
      if(e.Legende) {
        if(!legends.includes(e.Legende)) {
          legends.push(e.Legende);
          let p = document.createElement("p");
          p.classList.add('bar-' + e.Couleur);
          p.innerHTML = e.Legende;
          document.querySelector("#legend").appendChild(p);
        }
      }
  });

  let options = {
    on_date_change: async (task, start, end) => {
      //console.log(`${task.name} → ` + task.id +  ' - ' + start + ` au ` + end);
      console.log(`${task.name} → ${task.id} - ` + start.toLocaleDateString("fr-CA") + ` au ` + end.toLocaleDateString("fr-CA"));
      //console.log(`${task.name} → ` + task.id +  ' - ' + start.toISOString().split('T')[0] + ` au ` + end.toISOString().split('T')[0]);
      task.end = end;
      task.start = start;

      indice = tasks.indexOf(task);
      modif[indice] = indice;
      console.log(modif);

      document.querySelector("#gantt-header").classList.add('changed');
      document.querySelector("#updateBtn").classList.remove('btnDisabled');

    },
    view_mode: "Week",
    line: "vertical",
    padding:10,
    language: "fr",
    infinite_padding: true,
    view_mode_select: false,
    today_button: false,
    popup: function(opts) {
      const { task, get_title, get_details, set_details, add_action } = opts;
      // Contenu du popup
      set_details(`
        <div class="customPopUp">
          <p>` + task.start.toLocaleDateString("fr-CA") + ` ➤ ` + task.end.toLocaleDateString("fr-CA") + `</p>` + 
          ((task.comment) ? `<div class="customPopUpComment">` + marked.parse(task.comment, { breaks: true }) + `</div>` : ``) + 
          `<!--<p>Progression : ${task.progress}%</p>-->
        </div>
      `);

      /*
      // Ajouter une action (bouton) dans le popup
      add_action('<button>Mon action</button>', () => {
        console.log("Action pour la tâche", task.id);
        // Tu peux déclencher une fonction ici : ouvrir modal, etc.
      });
      */

      //Titre:
      opts.set_title(`<strong>` + task.legend + `</strong>`);
      
      // Si tu ne retournes rien (ou `undefined`), le système continue avec cette configuration
    }
  };

  const root = document.querySelector("#gantt-root");
  // 🔹 Nettoyer tout le contenu précédent
  root.innerHTML = "";
  // 🔹 Créer un nouveau <svg> vide
  const svg = document.createElement("svg");
  svg.id = "gantt"; // ID fixe pour l'init
  root.appendChild(svg);

  
  gantt = new Gantt("#gantt", tasks, options);

  const updateButton = document.getElementById('updateBtn');

  // Mise à jour
  //===========================================================================================
  updateButton.addEventListener('click', async () => {
    
    //console.log(gantt.tasks);
    console.log(mappedTable);

    
    //Construction de la structure pour modifier le tableau -----------------------------------
    let rec = [];
    modif.forEach((value, i) => {
      console.log(i + ' -- ' + tasks[i].id + ' -- ' + tasks[i].name);
      startDate = tasks[i].start.toLocaleDateString("fr-CA");
      endDate = tasks[i].end.toLocaleDateString("fr-CA");

      t = {
        //TaskName: ["l", tasks[i].name],
        NbJours: calculateDays(startDate, endDate),
        Debut: startDate
      }
      t = grist.mapColumnNamesBack(t); //la fonction recréer les clés manquantes en undefined. Suppression après...
      console.log("t:");
      for (const key in t) {
        if (t[key] === undefined) {
          delete t[key];
        }
      }
      console.log(t);

      rec.push(
        {
            id: parseInt(tasks[i].id),
            fields : t
          }
      )

    });

    //Mise à jour dans grist
    //await grist.selectedTable.update(rec);
    await grist.getTable().update(rec);
    
  });


  

});

grist.onRecord(record => {
  
});


/* FIN GRIST **********************************************************************************************/



//Fonction de calcul de jours entre 2 dates
function calculateDays(startDate, endDate) {
  let start = new Date(startDate);
  let end = new Date(endDate);
  let timeDifference = end - start;
  let daysDifference = timeDifference / (1000 * 3600 * 24);
  return daysDifference + 1;
}

function addDays(date, days) {
  const result = new Date(date); // on clone la date d’origine
  result.setDate(result.getDate() + days);
  return result;
}







