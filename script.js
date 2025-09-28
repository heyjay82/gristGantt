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
      description: "Nom de la tâche"
    },
    {
      name: "Couleur",
      optional: true,
      type: "Text",
      description: "blue|red|green|orange|purple"
    },
  ]
});

grist.onRecords(table => {

  mappedTable = grist.mapColumnNames(table);
  console.log(mappedTable);
  console.log('ok');

  document.querySelector("#gantt-header").classList.remove('changed');
  document.querySelector("#updateBtn").style.visibility = 'hidden';

  let tasks = [];
  let modif = [];

  //Construction du tableau Gantt
  mappedTable.forEach((e) => {
    tasks.push(
      {
        id: e.id,
        name: e.TaskName,
        start: e.Debut,
        end: addDays(e.Debut, e.NbJours), //e.Fin,
        progress: 0,
        custom_class: 'bar-' + e.Couleur
      });
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
      document.querySelector("#updateBtn").style.visibility = 'visible';

    },
    view_mode: "Week",
    line: "vertical",
    padding: 10,
    language: "fr",
    infinite_padding: true,
    view_mode_select: false,
    today_button: false
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
          fields: t
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
