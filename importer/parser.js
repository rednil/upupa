const parser = {
	year: 2025,
	architecture: {
		options: [
			{
				allow: /^(\d+)\s*mm/,
				value: match => `${match[1]}mm`
			},
			{
				allow: /oval/,
				value: '30mm x 45mm'
			},
			{
				allow: /(\d)x(\d+)mm/,
				value: match => `${match[1]} x ${match[2]}mm`
			},
			{
				allow: /Specht/,
				value: 'Specht'
			},
			{
				allow: /Wamsel/,
				value: 'Wasseramsel'
			},
			{
				allow: /Wiedehopf/,
				value: 'Wiedehopf'
			},
			{
				allow: /Waldbauml/,
				value: 'Waldbaumläufer'
			},
			{
				allow: /Wendehals/,
				value: 'Wendehals'
			},
			{
				allow: /TS 32mm/,
				value: 'TS 32mm'
			},
			{
				allow: /HalbHöhle/,
				value: 'Halb-Höhle'
			}
		]
	},
	eggs: {
		options: [
			{ 
				allow: [
					/(\d+)\s*Ei/,
					/\((\d+)\?\)\s*Ei/,
					/(\d+) E/
				],
				value: match => Number(match[1]),
				default: 0
			}
		]
	},
	nestlings: {
		options: [
			{ 
				allow: [
					/(\d+)\s*Nestling/,
					/\((\d+)\?\)\s*Nestling/,
					/(\d+)\s..\sNestlinge\sberingt/,
					/Nestlinge\s*\((\d+)\?\)/,
					/(\d).\sNestling\sgeschlüpft/
				],
				disAllow: [
					/Nestling noch beringt/
				],
				value: match => Number(match[1]),
				default: 0
			}
		]
	},
	breedingStart: {
		options: [
			{
				allow: [
					/Bb[^\d]*(\d+)\.(\d+)/,
					/W brütet am (\d+)\.(\d+)/
				],
				value: dateFormatter
			}
		]
	},
	layingStart: {
		options: [
			{
				allow: [
					/Lb[^\d]*(\d+)\.(\d+)/,
					/Eiablage[^\d]*(\d+)\.(\d+)/
				],
				value: dateFormatter
			}
		]
	},
	hatchDate: {
		options: [
			{
				allow: /H[^\d]*(\d+)\.(\d+)/,
				value: dateFormatter
			}
		]
	},
	nestlingsAge: {
		options: [
			{
				allow: [
					/Nestlinge \d-(\d) [Tt]ag/,
					/Nestlinge ca \d-(\d) [Tt]ag/,
					/Nestlinge [Tt]ag \d-(\d)/,
					/Nestlinge (\d)\s*[Tt]ag/,
					/Nestlinge ca (\d+)\s*[Tt]ag/,
					/Nestlinge [Tt]ag\s*(\d)/,
					/Nestlinge ca Tag[e]*\s*(\d)/,
					/ca (\d) [Tt]ag[e]* alt/,
					/Nestlinge geschlüpft (\d) tag/,
					/Nestlinge KM (\d) Tag/,
					/Nestlinge !!(\d) Tag alt/,
					/Nestlinge 1 Ei Ca \d-(\d) Tag/,
					/Nestlinge 2 Eier Tag \d-(\d)/,
					/Nestlinge 1 Ei Tag (\d)/,
				],
				value: match => Number(match[1]),
			},
			{
				allow: [
					/Nestling[e]* hO/,
					/hatchingobs/,
					/Nestlinge ca 12h alt/,
					/Hatching O/,
					/Hatching obs/,
					/1 Nestling geschlüpft/,
					/2 Nestlinge geschlüpft/,
					/Nestlinge geschlüpft 1 Ei/
				],
				value: 0
			}
		]
	},
	nestlingsBandDate: {
		options: [
			{
				allow: [
					/Nestlinge.*ring.[\s\(]+(\d+)\.(\d+)/,
					/beringt (\d+)\.(\d+)/,
					/B\.(\d+)\.(\d+)/,
					/Nestlinge\s*(\d+)\.(\d+)/,
					/Nestlinge [KB]M (\d+)\.(\d+)/
				],
				value: dateFormatter,
			}
		]
	},
	nestlingsBanded: {
		options: [
			{
				allow: [
					/(\d+)[^\d]*Nestling.*ringt/,
					/(\d+)N [bB]ering/,
					/(\d+) Kleiber beringt/
				],
				value: match => Number(match[1])
			}
		]
	},
	femaleBanded: {
		options: [
			{
				allow: [
					'W [bB]eringt',
					'beide Altvögel beringt',
					/[KB]M[ \(]*[Bb]eringt/,
					/10 E beringt KM/,
					/Altvogel ist beringt/,
					/Altvogel beringt/,
					/Wberingt/,
					/aduklt  beringt/
				],
				value: true
			}
		]
	},
	maleBanded: {
		options: [
			{
				allow: 'beide Altvögel beringt',
				value: true
			}
		]
	},
	speciesName: {
		options: [
			{	value: 'Blaumeise', 		allow: ['BM'] 						},
			{ value: 'Kleiber', 			allow: ['Kleiber', 'KL'] 	},
			{ value: 'Kohlmeise', 		allow: ['KM']							},
			{ value: 'Sumpfmeise', 		allow: ['SM']							},
			{ value: 'Wasseramsel', 	allow: ['WA']							},
			{ value: 'Feldsperling', 	allow: ['FS']							},
			{ value: 'Tannenmeise', 	allow: ['TM']							},
			{ value: 'Wendehals', 		allow: []									},
			{ value: 'Weidenmeise',		allow: ['WM']							}
		]
	},
	state: {
		options: [
			{ 
				value: 'STATE_SUCCESS',
				allow: [
					'[Aa]usgeflogen',
					'ausgefolgen',
					'Nestling tot NK sauber',
					'Ausflugskontrolle nachholen'
				],
				boxDates: [
					// {box: 'A03', date: '2023-07-01'}
					{box: 'B12', date: '2024-05-06'},
					{box: 'S02', date: '2024-06-10'},
					{box: 'S10', date: '2024-05-20'},
					{box: 'SF305', date: '2024-04-29'}
				]
			},
			{ 
				value: 'STATE_OCCUPIED',
				allow: [
					'Nest-Okkupation',
					'Siebenschläfer',
					'Nestprädation',
					'Hornisse',
					'Wespennest'
				],
				disAllow: 'Nest-Okkupation BM'
			},
			{ 
				value: 'STATE_ABANDONED',
				allow: [
					'Nest-Okkupation',
					'Prädation',
					'Nestprädation',
					'Altvogel verunglückt',
					'Nest aufgegeben',
					'Brut aufgegeben',
					'Keine Eier mehr auffindbar',
					'alle Nestlinge verschwunden',
					'Nest ausgeräubert',
					'alle Nestlinge tot',
					'Nestaufgegeben',
					'Gel[e]*ge aufgegeben',
					'Eier kalt/ Nest entfernen',
					'Eier fehlen/ Nest entfernt',
				],
				disAllow: 'Nest-Okkupation BM',
				boxDates: [
					{ box: 'K03', date: '2021-05-20' },
					{ box: 'PAPA', date: '2023-06-03' },
					{ box: 'S09', date: '2024-05-27' }
				]
			},
			{ value: 'STATE_NESTLINGS', allow: ['Nestling', 'H obs.', /NK [bB]ering/] },
			{ value: 'STATE_BREEDING', allow: ['[bB]rütet'] },
			{ 
				value: 'STATE_EGGS',
				allow: [
					/(\d+)\s*Ei/,
					/\((\d+)\?\)\s*Ei/,
					'FS, Eier waren kurz vor Schlupf'
				],
				disAllow: ['Eichhörnchen', /[kK]eine Eier/]
			},
			{ value: 'STATE_NEST_BUILDING', allow: [
				'halbfertiges Nest',
				'Nestanfang',
				'fast fertiges Nest',
				'halb fertiges Nest',
				'Nest, fast fertig',
				'Moos',
				'fast fertigees Nest',
				'NA',
				'Nesteintrag'
			] },
			{ value: 'STATE_NEST_READY', allow: [
				'legebereit',
				'fertiges Nest',
				'fertig vorbereiteter Brutraum'
			] },
			{ value: 'STATE_EMPTY', allow: ['leer'] },
		]
	},
	reasonForLoss: {
		options: [
			{ value: 'TAKEOVER', allow: ['Nest-Okkupation BM'] },
			{ value: 'PREDATION', allow: [
				'Siebenschläfer',
				'Eichhörnchen',
				'Prädation',
				'Keine Eier mehr auffindbar',
				'Nest ausgeräubert'
			] },
			{ value: 'PARENT_MISSING', allow: [
				'Altvogel verunglückt',
				'Nest aufgegeben',
				'Brut aufgegeben'
			]}
		]
	},
	perpetrator: {
		options: [
			{ value: 'Siebenschläfer' },
			{ value: 'Eichhörnchen' },
			{ value: 'Hornisse' },
			{ value: 'Wespe' }
		]
	},
	scope: {
		options: [
			{ 
				value: 'SCOPE_OUTSIDE',
				allow: ['O.K.', 'Altvögel am Nest'],
				disAllow: /\d+\sNestlinge beringt/
			},
		],
		default: 'SCOPE_INSIDE'
	},
	takeover: {
		options: [
			{ value: true, allow: ['Nest-Okkupation BM'] },
		]
	}
	
}
function dateFormatter(match){
	const month = ('0' + match[2]).slice(-2)
	const date = ('0' + match[1]).slice(-2)
	const dateStr = `${parser.year}-${month}-${date}`
	return new Date(dateStr)
}
export default parser