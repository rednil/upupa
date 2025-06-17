const year = 2025

const parser = {
	eggs: {
		options: [
			{ 
				allow: [
					/(\d+)\s*Ei/,
					/\((\d+)\?\)\s*Ei/
				],
				value: match => Number(match[1])
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
				value: match => Number(match[1])
			}
		]
	},
	breedingStart: {
		options: [
			{
				allow: [
					/Bb[^\d]*(\d+).(\d+)/,
					/W brütet am (\d+).(\d+)/
				],
				value: dateFormatter
			}
		]
	},
	layingStart: {
		options: [
			{
				allow: [
					/Lb[^\d]*(\d+).(\d+)/,
					/Eiablage[^\d]*(\d+).(\d+)/
				],
				value: dateFormatter
			}
		]
	},
	hatchDate: {
		options: [
			{
				allow: /H[^\d]*(\d+).(\d+)/,
				value: dateFormatter
			}
		]
	},
	nestlingsBandDate: {
		options: [
			{
				allow: /Nestlinge.*ring.[^\d]+(\d+).(\d+)/,
				value: dateFormatter
			}
		]
	},
	nestlingsBanded: {
		options: [
			{
				allow: /(\d+)[^\d]*Nestlinge.*ringt/,
				value: match => Number(match[1])
			}
		]
	},
	femaleBanded: {
		options: [
			{
				allow: ['W beringt', 'beide Altvögel beringt'],
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
			{ value: 'Tannenmeise', 	allow: ['TM']							}
		]
	},
	state: {
		options: [
			{ value: 'STATE_SUCCESS', allow: ['ausgeflogen', 'ausgefolgen']},
			{ 
				value: 'STATE_OCCUPIED',
				allow: [
					'Nest-Okkupation',
					'Siebenschläfer',
					'Nestprädation',
					'Hornisse'
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
					'alle Nestlinge verschwunden'
				],
				disAllow: 'Nest-Okkupation BM'
			},
			{ value: 'STATE_NESTLINGS', allow: ['Nestling'] },
			{ value: 'STATE_BREEDING', allow: ['brütet'] },
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
				'Keine Eier mehr auffindbar'
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
			{ value: 'Hornisse' }
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
	const dateStr = `${year}-${month}-${date}`
	return new Date(dateStr)
}
export default parser