# ExamTrainers

Open source exam training web apps, published as a static GitHub Pages site.

## Structure

- `trainers/index.html` is the landing page used to select a trainer.
- `trainers/an3-sem2/micro/` contains the AVR microcontroller trainer.
- `trainers/an4-sem1/securitatea-datelor/` contains the Securitatea Datelor (SD) exam trainer.
- `trainers/an4-sem1/proiectarea-translatoarelor/` contains the Proiectarea Translatoarelor (PT) exam trainer and interactive workbenches.
- `.github/workflows/pages.yml` deploys the `trainers/` folder to GitHub Pages on pushes to `main`.

## Adding a trainer

1. Create a new folder under `trainers/`.
2. Add the trainer page inside that folder.
3. Register the new entry in `trainers/index.html` with a relative link.

## Current status

The collection currently contains:
1. **AN3 Semester 2**: Microprocesoare (`trainers/an3-sem2/micro/`)
2. **AN4 Semester 1**: Securitatea Datelor (`trainers/an4-sem1/securitatea-datelor/`)
3. **AN4 Semester 1**: Proiectarea Translatoarelor (`trainers/an4-sem1/proiectarea-translatoarelor/`)

