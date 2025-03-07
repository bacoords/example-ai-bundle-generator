/**
 * External dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { Button, Flex, Card, CardBody, CardMedia, CardFooter, __experimentalGrid as Grid } from '@wordpress/components';
import * as Woo from '@woocommerce/components';
import { Fragment, useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
const { enums, helpers, store: aiStore } = window.aiServices.ai;

const SERVICE_ARGS = { capabilities: [ enums.AiCapability.TEXT_GENERATION ] };

/**
 * Internal dependencies
 */
import './index.scss';

const AIBundleGenerator = () => {

	const [ products, setProducts ] = useState( [] );
	const [ fullProducts, setFullProducts ] = useState( [] );
	const [ excerpt, setExcerpt ] = useState( '' );
	const [ bundle, setBundle ] = useState( null );
	const [ bundleTitle, setBundleTitle ] = useState( '' );
	const service = useSelect( ( select ) =>
		select( aiStore ).getAvailableService( SERVICE_ARGS.capabilities )
	);

	if ( ! service ) {
		return null;
	}

	const searchFullProducts = async ( items ) => {
		setProducts( items );
		const query = {
			per_page: 10,
			orderby: 'popularity',
			include: items.map( ( item ) => item.key ).join( ',' ),
		};
		const response = await apiFetch( {
			path: addQueryArgs( '/wc-analytics/products', query ),
		} );

		setFullProducts( response.map( ( product ) => ( {
			...product,
			label: product.name,
		} ) ) );
	};

	const generate = async () => {

		const comboProducts = fullProducts.map( ( product ) => (
			`${ product.name }: ${ product.description }`
		) ).join( '\n\n' );

		// Generate product bundle with AI-powered description
		let candidates;
		try {
			candidates = await service.generateText(
				__(
					'Generate a product description for a combo product that includes the following products:',
					'ai-bundle-generator'
				) +
					' ' +
					comboProducts,
				{ feature: 'ai-bundle-generator' }
			);
		} catch ( error ) {
			window.console.error( error );
			return;
		}

		const generatedExcerpt = helpers
			.getTextFromContents(
				helpers.getCandidateContents( candidates )
			)
			.replaceAll( '\n\n\n\n', '\n\n' );

		setExcerpt( generatedExcerpt );
		setBundleTitle( createBundleTitle() );
	};

	const createBundle = async () => {
		const data = {
			name: bundleTitle,
			type: 'grouped', 
			description: excerpt,
			short_description: excerpt.split('\n')[0], // First paragraph as short description
			categories: fullProducts.reduce((cats, product) => {
				// Combine unique categories from all products
				const productCats = product.categories || [];
				productCats.forEach(cat => {
					if (!cats.some(existing => existing.id === cat.id)) {
						cats.push({ id: cat.id });
					}
				});
				return cats;
			}, []),
			images: fullProducts.map(p => {
				return { id: p.images[0].id };
			}),
			grouped_products: fullProducts.map(p => p.id)
		};

		try {
			const response = await apiFetch({
				path: '/wc-analytics/products',
				method: 'POST',
				data: data
			});
			console.log('Bundle created:', response);
			// Clear the form after successful creation
			setProducts([]);
			setFullProducts([]);
			setExcerpt('');
			setBundle( response );
		} catch (error) {
			console.error('Error creating bundle:', error);
		}
	};

	const createBundleTitle = () => {
		return `Bundle: ${fullProducts.map(p => p.name).join(' + ')}`;
	};

	const editBundle = async () => {
		window.open( `/wp-admin/post.php?post=${ bundle.id }&action=edit`, '_blank' );
	};

	return (
	<Fragment>
		<Woo.Section component="article">
			<Woo.SectionHeader title={ __( 'Search', 'ai-bundle-generator' ) } />
			<Woo.Search
				type="products"
				placeholder="Search for something"
				selected={ products }
				onChange={ searchFullProducts }
				inlineTags
			/>
		</Woo.Section>


		{ products.length > 0 && fullProducts.length > 0 && (
			<Woo.Section component="article" style={ { marginTop: '20px' } }>
				<Fragment >
					<Grid gap={ 2 } columns={ 4 }>
						{ fullProducts.map( ( product ) => (
							<Card key={ product.key }>
								<CardMedia>
									<Woo.ProductImage product={ product } />
								</CardMedia>
								<CardBody>
									<h3>{ product.label }</h3>
								</CardBody>
							</Card>
						) ) }
					</Grid>
				</Fragment>
			</Woo.Section>
			) }
			{ products.length > 1 && fullProducts.length > 1 && (
				<Woo.Section component="article">
				<Fragment>
					<Flex justify="flex-end">	
						<Button variant="secondary" onClick={ () => setProducts( [] ) }>
							{ __( 'Clear', 'ai-bundle-generator' ) }
						</Button>
						<Button variant="primary" onClick={ generate }>
							{ __( 'Generate Bundle Description', 'ai-bundle-generator' ) }
						</Button>
					</Flex>
				</Fragment>
			</Woo.Section>
			) }
		{ excerpt && (
			<Woo.Section component="article">
				<Woo.SectionHeader title={ __( 'Generated Bundle Description', 'ai-bundle-generator' ) } />
				<Card>
					<CardBody>
						<h2>{ bundleTitle }</h2>
						<p>{ excerpt }</p>
					</CardBody>
					<CardFooter>

							<Button variant="secondary" onClick={ () => setExcerpt( '' ) }>
								{ __( 'Clear', 'ai-bundle-generator' ) }
							</Button>
							<Button variant="primary" onClick={ createBundle }>
								{ __( 'Create Bundle Product', 'ai-bundle-generator' ) }
							</Button>

					</CardFooter>
				</Card>
			</Woo.Section>
		) }

		{ bundle && (
			<Woo.Section component="article">
				<Woo.SectionHeader title={ __( 'Bundle Created', 'ai-bundle-generator' ) } />
				<p>{ bundle.name }</p>
				<Flex justify="flex-end">
					<Button variant="secondary" onClick={ editBundle }>
						{ __( 'Edit Bundle Product', 'ai-bundle-generator' ) }
					</Button>
				</Flex>
			</Woo.Section>
		) }
	</Fragment>
	);
};

addFilter( 'woocommerce_admin_pages_list', 'ai-bundle-generator', ( pages ) => {
	pages.push( {
		container: AIBundleGenerator,
		path: '/ai-bundle-generator',
		breadcrumbs: [ __( 'AI Bundle Generator', 'ai-bundle-generator' ) ],
		navArgs: {
			id: 'ai_bundle_generator',
		},
	} );

	return pages;
} );
