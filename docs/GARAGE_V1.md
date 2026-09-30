# Garage Domain V1

Garage is not Favorites.

It stores the user's relationship to canonical products:
- Owned
- Dream
- Try

UserEquipment references Product by stable ID. Product specs are never copied into user state.

RaceSetup references UserEquipment IDs, so a setup can preserve a user's customization without mutating the canonical product.

Commercial insight must keep Owned, Dream and Try separate. They are different signals and must never be summed as equivalent demand.

UI target:
- Bikes / Gear / Memorabilia / Places as content filters where appropriate
- Owned / Dream / Try as relationship filters
- My Race Setup as a deliberate composition
- one dominant action: Build setup
