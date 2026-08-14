/**
 * Places within a few hours of Cottage Grove, Oregon.
 *
 * `drive` is approximate one-way driving time from Cottage Grove. Verify
 * before you go — 101 and the Coast Range roads slow down in rain.
 *
 * `access` describes mobility access as reported by Travel Oregon, the Oregon
 * Coast Visitors Association, and Oregon State Parks. `accessLevel` is a rough
 * sort key, not a guarantee. Call ahead when it matters.
 *   'easy'    — paved, level, little or no grade
 *   'partial' — some of it works, some of it does not
 *   'hard'    — stairs or steep grades that can't be avoided
 */

export const PLACES = [
  // ——— Central coast ———
  {
    id: 'florence-oldtown',
    name: 'Old Town Florence',
    region: 'Central coast',
    drive: 105,
    tags: ['cozy', 'town', 'food'],
    blurb:
      'Bay Street under the Siuslaw River Bridge — colorful storefronts, galleries, used bookshops, River Roasters for coffee. The most walkable coastal town in easy reach.',
    access:
      'Flat riverfront streets and boardwalk. A David\'s Chair all-terrain track chair can be reserved in Florence, and Heceta Beach has a Mobi-Mat over the sand.',
    accessLevel: 'easy',
  },
  {
    id: 'darlingtonia',
    name: 'Darlingtonia State Natural Site',
    region: 'Central coast',
    drive: 110,
    tags: ['quirky', 'nature', 'free'],
    blurb:
      'A short boardwalk over a bog of cobra lilies — native carnivorous pitcher plants that lure insects in with pretty colors and then digest them. Three miles north of Florence, free, and takes fifteen minutes.',
    access: 'Short level boardwalk loop from a small roadside lot.',
    accessLevel: 'easy',
  },
  {
    id: 'heceta-head',
    name: 'Heceta Head Lighthouse',
    region: 'Central coast',
    drive: 120,
    tags: ['icon', 'coast'],
    blurb:
      'The most photographed lighthouse on the coast, built 1894, perched over the surf. The keeper\'s house is a bed and breakfast.',
    access:
      'Accessible parking, then about a half mile of trail up to the lighthouse with some steep pitches. The pullouts on 101 just south give you the classic postcard view with no walking at all.',
    accessLevel: 'partial',
  },
  {
    id: 'sea-lion-caves',
    name: 'Sea Lion Caves',
    region: 'Central coast',
    drive: 120,
    tags: ['quirky', 'wildlife', 'paid'],
    blurb:
      'America\'s largest sea cave — a twelve-story basalt amphitheater at sea level, reached by an elevator that drops 208 feet through the cliff. Steller sea lions come and go as they please, so call first.',
    access:
      'Not wheelchair accessible. Roughly 37 steps inside the building to reach the outside trails, then about 400 yards of 10–20% grade, then the elevator. Another 63 steps inside the cave to the lighthouse viewpoint.',
    accessLevel: 'hard',
  },
  {
    id: 'cape-perpetua',
    name: 'Cape Perpetua — Thor\'s Well & Spouting Horn',
    region: 'Central coast',
    drive: 130,
    tags: ['quirky', 'coast', 'drama'],
    blurb:
      'A twenty-foot basalt hole that appears to swallow the Pacific whole. Best on an incoming tide about an hour before high. Devil\'s Churn and Cook\'s Chasm are the same pullout cluster.',
    access:
      'The paved Captain Cook Trail runs from the visitor center to a wheelchair-accessible viewing point over Spouting Horn and Thor\'s Well. The 800-foot Overlook is a separate drive with views from near the lot; the upper vantage points have stairs. Forest Pass or day-use fee.',
    accessLevel: 'partial',
  },
  {
    id: 'yachats',
    name: 'Yachats',
    region: 'Central coast',
    drive: 135,
    tags: ['cozy', 'town', 'tidepools'],
    blurb:
      'Small, quiet, and constantly dramatic — the surf hits basalt shelves right at the edge of town. The 804 Trail runs the oceanfront, and the Little Log Church Museum is a 1920s church built from timber floated down the Yachats River.',
    access:
      'The 804 Trail is largely level with a firm surface. Mobi-Mat beach access in town. The Little Log Church is a single-story building.',
    accessLevel: 'easy',
  },
  {
    id: 'waldport',
    name: 'Waldport & Alsea Bay',
    region: 'Central coast',
    drive: 145,
    tags: ['quiet', 'coast', 'water'],
    blurb:
      'The overlooked town between Yachats and Newport. Wide empty beach, a good bay to paddle, and almost nobody on it in September.',
    access:
      'The Port of Alsea has a floating launch with rollers, railings and benches so you can get into a kayak safely. Mobi-Mat beach access.',
    accessLevel: 'easy',
  },
  {
    id: 'seal-rock',
    name: 'Seal Rock State Recreation Site',
    region: 'Central coast',
    drive: 150,
    tags: ['tidepools', 'coast', 'free'],
    blurb:
      'A cluster of offshore monoliths with tidepools at their feet. Small, quick, and worth the pull-off.',
    access:
      'Scenic overlooks give you the rock formations and tidepools without a steep trail.',
    accessLevel: 'partial',
  },
  {
    id: 'newport',
    name: 'Newport — Nye Beach & the Bayfront',
    region: 'Central coast',
    drive: 160,
    tags: ['town', 'food', 'cozy'],
    blurb:
      'Two towns in one: the Historic Bayfront with working fishing boats and loudly barking sea lions on Port Dock One, and Nye Beach with its bookshop-and-gallery arts district. Local Ocean on the bayfront is the seafood everybody argues about.',
    access:
      'Nye Beach has paved paths, ramps and accessible parking; Agate Beach has upgraded restrooms and a paved trail toward the sand. The Bayfront is a level historic waterfront walk. Nye Beach galleries are mostly step-free.',
    accessLevel: 'easy',
  },
  {
    id: 'yaquina-head',
    name: 'Yaquina Head Outstanding Natural Area',
    region: 'Central coast',
    drive: 165,
    tags: ['nature', 'tidepools', 'paid'],
    blurb:
      'A grassy headland running a mile out to sea, Oregon\'s tallest lighthouse, and a cobble tidepool beach below. Seabirds, harbor seals, and gray whales offshore.',
    access:
      'Accessible viewing deck, and 145 feet of Mobi-mats laid to reach the tide pools at low tide. The interpretive center is accessible.',
    accessLevel: 'easy',
  },
  {
    id: 'oregon-coast-aquarium',
    name: 'Oregon Coast Aquarium',
    region: 'Central coast',
    drive: 165,
    tags: ['indoor', 'rainy-day', 'paid'],
    blurb:
      'The region\'s best rainy-day fallback. Sea otters, a giant walk-through tunnel, and a touch tidepool that was rebuilt to work from a seated height.',
    access:
      'Fully ADA — level pathways throughout, accessible restrooms, and a wheelchair-accessible touch tidepool.',
    accessLevel: 'easy',
  },
  {
    id: 'depoe-bay',
    name: 'Depoe Bay',
    region: 'North-central coast',
    drive: 175,
    tags: ['whales', 'quirky', 'coast'],
    blurb:
      'The world\'s smallest navigable harbor, and the best place on the coast to see a whale from dry land. The spouting horns fire straight over the seawall in a swell.',
    access:
      'The seawall viewpoint runs right along Highway 101 — you can watch from the sidewalk. Several charter operators including Dockside use ADA-accessible vessels you can roll straight onto.',
    accessLevel: 'easy',
  },
  {
    id: 'lincoln-city',
    name: 'Lincoln City',
    region: 'North-central coast',
    drive: 185,
    tags: ['quirky', 'beachcombing', 'town'],
    blurb:
      'Finders Keepers runs year-round now — volunteers hide handblown glass floats on the beach and you keep what you find. Seven miles of sand to hunt.',
    access:
      'Multiple ramped access points to the sand, ADA restrooms at the popular entrances, and free beach wheelchairs through the community center. Roads End is an accessible panoramic viewpoint.',
    accessLevel: 'easy',
  },

  // ——— South coast ———
  {
    id: 'oregon-dunes-overlook',
    name: 'Oregon Dunes Overlook',
    region: 'South coast',
    drive: 110,
    tags: ['nature', 'free', 'wide-open'],
    blurb:
      'Forty miles of sand mountains running inland from the surf, and this is the spot that shows you the scale of it without a permit or a dune buggy.',
    access:
      'Accessible viewing platform right off the parking lot, a half-mile paved trail to a second viewing area, and wheelchair-friendly picnic tables under the spruce.',
    accessLevel: 'easy',
  },
  {
    id: 'winchester-bay',
    name: 'Winchester Bay & Umpqua Lighthouse',
    region: 'South coast',
    drive: 115,
    tags: ['coast', 'quiet', 'lighthouse'],
    blurb:
      'A working crab dock, a red-and-white striped lighthouse, and the Umpqua Discovery Center in Reedsport telling the river\'s story. Quiet in a way the central coast is not.',
    access:
      'Discovery Center is a single-level museum. Lighthouse grounds and the whale-watching platform are near the parking.',
    accessLevel: 'partial',
  },
  {
    id: 'coos-bay',
    name: 'Coos Bay & North Bend',
    region: 'South coast',
    drive: 135,
    tags: ['town', 'food', 'events'],
    blurb:
      'The biggest town on the south coast and the hub for everything in Charleston. Prefontaine\'s hometown — the memorial run and Cruz the Coos both land in the middle of your window.',
    access: 'Downtown Coos Bay is flat and walkable. Mobi-Mat beach access in the Charleston area.',
    accessLevel: 'easy',
  },
  {
    id: 'shore-acres',
    name: 'Shore Acres State Park',
    region: 'South coast',
    drive: 150,
    tags: ['garden', 'cozy', 'coast'],
    blurb:
      'A timber baron\'s cliff-top estate turned into formal gardens — two rose gardens, a Japanese-style garden with a lily pond, and an observation building where the waves explode against the sandstone below. Something is always in bloom.',
    access:
      'You can borrow a wheelchair free at the park to reach the gardens and overlooks. Garden paths are maintained and the observation building is close to the lot.',
    accessLevel: 'easy',
  },
  {
    id: 'cape-arago',
    name: 'Cape Arago & Sunset Bay',
    region: 'South coast',
    drive: 155,
    tags: ['wildlife', 'coast', 'free'],
    blurb:
      'Just past Shore Acres. Simpson Reef below is a haul-out for hundreds of seals and sea lions — you hear them before you see them. Sunset Bay is a sheltered half-moon cove good for a cold swim.',
    access: 'Simpson Reef Overlook is a viewpoint near the road. Beach access at Sunset Bay is short but unpaved.',
    accessLevel: 'partial',
  },
  {
    id: 'bandon',
    name: 'Bandon — Old Town & Face Rock',
    region: 'South coast',
    drive: 170,
    tags: ['cozy', 'town', 'coast'],
    blurb:
      'Sea stacks stacked up along the beach like a chess set, a small Old Town on the Coquille, and cranberry bogs inland turning red in September. The far edge of a comfortable day trip — better as an overnight.',
    access: 'Face Rock Viewpoint is a paved overlook right off the road. Old Town is level and compact.',
    accessLevel: 'partial',
  },

  // ——— Home & inland ———
  {
    id: 'row-river-trail',
    name: 'Row River Trail & the covered bridges',
    region: 'Home',
    drive: 5,
    tags: ['cozy', 'bikeable', 'free', 'home'],
    blurb:
      'Sixteen paved miles from downtown out around Dorena Lake — Oregon\'s first designated Scenic Bikeway. Six covered bridges in the loop, including Chambers Railroad Bridge, the last covered railroad bridge in the West. The maples go orange in October.',
    access:
      'The Row River Trail is paved, flat and rail-grade the whole way — the most accessible long walk or roll in the region. Rainy Peak Bicycles on Main rents bikes.',
    accessLevel: 'easy',
  },
  {
    id: 'bohemia-museum',
    name: 'Bohemia Gold Mining Museum',
    region: 'Home',
    drive: 5,
    tags: ['quirky', 'history', 'home'],
    blurb:
      'A red barn full of gold rush equipment, ore samples and claim maps from the Bohemia Mining District up the mountain. They\'ll let you pan for a few dollars and you keep what you find. Small donation, small hours — check before you go.',
    access: 'Single-level museum building.',
    accessLevel: 'easy',
  },
  {
    id: 'saginaw-vineyard',
    name: 'Saginaw Vineyard & the Territorial wineries',
    region: 'Home',
    drive: 10,
    tags: ['wine', 'cozy', 'harvest'],
    blurb:
      'Saginaw is eight minutes north. Iris, King Estate and Chateau Lorane are strung along Territorial Highway. Your whole window is harvest — crush is happening while you\'re there.',
    access: 'Varies by winery; King Estate and Iris have accessible tasting rooms and parking.',
    accessLevel: 'partial',
  },
  {
    id: 'salt-creek-falls',
    name: 'Salt Creek Falls',
    region: 'Cascades',
    drive: 75,
    tags: ['nature', 'waterfall'],
    blurb:
      'A 286-foot plunge, the second-highest waterfall in Oregon, right off Highway 58 at the top of Willamette Pass.',
    access: 'Paved accessible overlook a short distance from the parking area. The canyon trail below is steep.',
    accessLevel: 'easy',
  },
  {
    id: 'wildlife-safari',
    name: 'Wildlife Safari, Winston',
    region: 'Umpqua',
    drive: 75,
    tags: ['quirky', 'paid', 'wildlife'],
    blurb:
      'A drive-through safari park in the Umpqua hills. Cheetahs, rhinos and bears wander past your windshield. Deeply strange and completely sincere.',
    access: 'You never leave the car for the main loop, which makes it accessible by default. The walk-through village is level.',
    accessLevel: 'easy',
  },
  {
    id: 'oakland-or',
    name: 'Oakland, Oregon',
    region: 'Umpqua',
    drive: 60,
    tags: ['cozy', 'quirky', 'antiques'],
    blurb:
      'A two-block brick historic district that time forgot, forty minutes down I-5. Antiques, a good old café, and almost no one else there on a weekday.',
    access: 'Flat sidewalks; some shops have a single step.',
    accessLevel: 'partial',
  },
  {
    id: 'elkton',
    name: 'Elkton & the Umpqua Scenic Byway',
    region: 'Umpqua',
    drive: 65,
    tags: ['nature', 'quirky', 'scenic-drive'],
    blurb:
      'The prettiest way to the coast — Highway 38 down the Umpqua River past the Dean Creek elk viewing area. Elkton has a butterfly pavilion and a small winery. Turns a coast run into the trip itself.',
    access: 'Dean Creek Elk Viewing Area has accessible pull-offs and viewing platforms right off the highway.',
    accessLevel: 'easy',
  },
  {
    id: 'brownsville',
    name: 'Brownsville',
    region: 'Willamette Valley',
    drive: 55,
    tags: ['quirky', 'film', 'cozy'],
    blurb:
      'The town that played Castle Rock in Stand By Me. The Living Rock Studios down the road is a stone building full of backlit rock pictures made by one man over decades — genuinely one of the strangest things in the valley.',
    access: 'Compact flat downtown.',
    accessLevel: 'partial',
  },
  {
    id: 'mckenzie-river',
    name: 'McKenzie River — Sahalie & Koosah Falls',
    region: 'Cascades',
    drive: 110,
    tags: ['nature', 'waterfall', 'blue-water'],
    blurb:
      'Impossibly blue water over black lava. Sahalie and Koosah are a short loop apart; Tamolitch Blue Pool is a longer hike further down.',
    access: 'Sahalie Falls has a paved viewpoint close to the lot. The loop trail between the falls has stairs and roots.',
    accessLevel: 'partial',
  },
  {
    id: 'silver-falls',
    name: 'Silver Falls State Park',
    region: 'Willamette Valley',
    drive: 125,
    tags: ['nature', 'waterfall'],
    blurb:
      'The Trail of Ten Falls, including several you can walk behind. Peak season is over by September, so you get the canyon closer to yourself.',
    access:
      'The South Falls day-use area and its viewpoint are reachable on maintained surfaces. The canyon loop itself has long descents and steps.',
    accessLevel: 'partial',
  },
  {
    id: 'crater-lake',
    name: 'Crater Lake — Rim Village',
    region: 'Cascades',
    drive: 180,
    tags: ['big-day', 'nature', 'paid'],
    blurb:
      'The deepest lake in America sitting in a collapsed volcano, with thirty overlooks around a 33-mile rim drive. At the outer edge of your range and worth an overnight.',
    access:
      'Sinnott Memorial Overlook at Rim Village is close to parking and Rim Drive is a stop-and-look road. Snow can close the rim road with little warning in early October.',
    accessLevel: 'partial',
  },
  {
    id: 'mount-pisgah',
    name: 'Mount Pisgah Arboretum',
    region: 'Willamette Valley',
    drive: 30,
    tags: ['nature', 'free', 'mushrooms'],
    blurb:
      'Two hundred acres of oak savanna and river bottom outside Eugene. Prime mushroom ground once the fall rains start, and the closest real walk to home.',
    access: 'Several level river-bottom trails; the summit trail is a genuine climb.',
    accessLevel: 'partial',
  },
];

/** Unique region names, in the order they first appear. */
export const REGIONS = [...new Set(PLACES.map((p) => p.region))];

/** Every tag in use, alphabetized. Used for searching, not for the filter bar. */
export const TAGS = [...new Set(PLACES.flatMap((p) => p.tags))].sort();

/**
 * The tags worth putting a button on. Showing all 34 turns the filter bar
 * into a wall — these are the ones that actually split the list usefully.
 */
export const FILTER_TAGS = [
  'cozy',
  'quirky',
  'coast',
  'nature',
  'tidepools',
  'town',
  'wildlife',
  'rainy-day',
  'free',
];

/** Format a drive time in minutes as a short human string. */
export function formatDrive(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m}`;
}
