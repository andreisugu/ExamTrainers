# ExamTrainers

Open source exam training web apps, published as a static GitHub Pages site.

## Structure

- `trainers/index.html` is the landing page used to select a trainer.
- `trainers/an3-sem2/micro/` contains the current AVR trainer.
- `.github/workflows/pages.yml` deploys the `trainers/` folder to GitHub Pages on pushes to `main`.

## Adding a trainer

1. Create a new folder under `trainers/`.
2. Add the trainer page inside that folder.
3. Register the new entry in `trainers/index.html` with a relative link.

## Current status

Right now the collection contains one trainer for AN3 semester 2, nested under `trainers/an3-sem2/micro/`.
