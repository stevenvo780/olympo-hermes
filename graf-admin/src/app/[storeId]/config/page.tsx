'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Container, Form, Button, Spinner, Row, Col, Alert, Tabs, Tab } from 'react-bootstrap';
import { useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { addNotification } from '@/redux/ui';
import { updateConfig } from '@/redux/config';
import api from '@/utils/axios';
import { Config, ProductDetailViewType, ProductContentType } from '@/types';
import { storage } from '@/utils/firebase';
import { RootState } from '@/redux/store';

import ImageConfigSection from './components/ImageConfigSection';
import ContactSection from './components/ContactSection';
import SeoSection from './components/SeoSection';
import FooterSection from './components/FooterSection';
import LegalSection from './components/LegalSection';
import CustomQuestionForm from './components/CustomQuestionForm';
import ColorPaletteSection from './components/ColorPaletteSection';
import ScheduleSection from './components/ScheduleSection';
import ActivationsSection from './components/ActivationsSection';
import AboutSection from './components/AboutSection';
import { Coordinates } from '@/types';
import CoordinatesSection from './components/CoordinatesSection';
import StoreAddressSection from './components/StoreAddressSection';
import DominiosSection from './components/DominiosSection';
import CustomMessageSection from './components/CustomMessageSection';
import IntegrationsSection from './components/IntegrationsSection';
import ProductViewConfigSection from './components/ProductViewConfigSection';
import ProductDetailConfigSection from './components/ProductDetailConfigSection';

const daysOfWeek = [
	{ id: 'monday', label: 'Lunes' },
	{ id: 'tuesday', label: 'Martes' },
	{ id: 'wednesday', label: 'Miércoles' },
	{ id: 'thursday', label: 'Jueves' },
	{ id: 'friday', label: 'Viernes' },
	{ id: 'saturday', label: 'Sábado' },
	{ id: 'sunday', label: 'Domingo' },
];

type DefaultPlugins = Record<string, { enabled: boolean; apiKey: string }>;
const defaultPlugins: DefaultPlugins = {
	talanton: { enabled: false, apiKey: '' },
	meraVuelta: { enabled: false, apiKey: '' },
	nous: { enabled: false, apiKey: '' },
};

interface MongoDBFields {
	_id?: string;
	__v?: number;
	createdAt?: string;
	updatedAt?: string;
}

type ConfigFormData = Config & MongoDBFields;

type SensitiveFields = 'id' | 'store' | '_id' | '__v' | 'createdAt' | 'updatedAt';

type TransferableConfig = Omit<Config, SensitiveFields>;

const ConfigPage = () => {
	const dispatch = useDispatch();
	const { storeId } = useParams() as { storeId: string };
	const storedConfig = useSelector((state: RootState) => state.config.config);
	const user = useSelector((state: RootState) => state.auth.userData);
	const [formData, setFormData] = useState<ConfigFormData | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isOwner, setIsOwner] = useState(false);
	const [bannerFile, setBannerFile] = useState<File[]>([]);
	const [logoFile, setLogoFile] = useState<File[]>([]);
	const [activeTab, setActiveTab] = useState<string>('encabezados');
	const fileInputRef = useRef<HTMLInputElement>(null);
	const isSavingRef = useRef(false);

	useEffect(() => {
		if (!storeId) return;
		const fetchConfig = async () => {
			setIsLoading(true);
			try {
				const storeResponse = await api.get(`/store/${storeId}`);
				const store = storeResponse.data;
				const isSuperAdmin = user?.role === 'super_admin';
				const isStoreOwner = store.owner.id === user?.id || isSuperAdmin;
				setIsOwner(isStoreOwner);

				if (!isStoreOwner) {
					setIsLoading(false);
					return;
				}

				const response = await api.get(`/config/${storeId}/my`);
				const configData = response.data as ConfigFormData;

				if (configData.enablePaymentLinks === undefined) {
					configData.enablePaymentLinks = false;
				}
				if (configData.showNavbarLogo === undefined) {
					configData.showNavbarLogo = true;
				}
				if (configData.showNavbarTitle === undefined) {
					configData.showNavbarTitle = true;
				}
				const parsedNavbarHeight = typeof configData.navbarHeight === 'number'
					? configData.navbarHeight
					: Number.parseInt(String(configData.navbarHeight), 10);
				const normalizedNavbarHeight = Number.isFinite(parsedNavbarHeight)
					? Math.min(Math.max(parsedNavbarHeight, 48), 200)
					: 60;
				configData.navbarHeight = normalizedNavbarHeight;

				if (configData.customQuestions) {
					configData.customQuestions = configData.customQuestions.map(q => {
						if (q.type === 'select' && !q.options) {
							return { ...q, options: [] };
						}
						return q;
					});
				} else {
					configData.customQuestions = [];
				}
				if (!configData.schedule) {
					configData.schedule = [];
				}
				if (!configData.dominios) {
					configData.dominios = [];
				}
				if (!configData.plugins) {
					configData.plugins = { ...defaultPlugins };
				}
				if (!configData.activations) {
					configData.activations = {
						requireLogin: false,
						requireUserData: false,
						deliveryEnabled: false
					};
				}
				if (!configData.productViewConfig) {
					configData.productViewConfig = {
						defaultView: 'carousel',
						filteredView: 'grid',
						availableViews: ['carousel', 'grid', 'clothing', 'list', 'featured', 'clothing-grid', 'wide-card', 'compact']
					};
				}
				if (!configData.productDetailConfig) {
					configData.productDetailConfig = {
						viewType: ProductDetailViewType.MODAL,
						contentType: ProductContentType.PLAIN,
						showRecommendedProducts: true,
						recommendedCardType: 'carousel',
						recommendedDisplayMode: 'carousel'
					};
				}
				// Ensure recommendedCardType exists for existing configs
				if (!configData.productDetailConfig.recommendedCardType) {
					configData.productDetailConfig.recommendedCardType = 'carousel';
				}
				// Ensure recommendedDisplayMode exists for existing configs
				if (!configData.productDetailConfig.recommendedDisplayMode) {
					configData.productDetailConfig.recommendedDisplayMode = 'carousel';
				}
				const updatedSchedule = [...configData.schedule];
				daysOfWeek.forEach(day => {
					if (!updatedSchedule.find(s => s.day === day.id)) {
						updatedSchedule.push({
							day: day.id,
							isOpen: true,
							openTime: '08:00',
							closeTime: '18:00',
						});
					}
				});
				updatedSchedule.sort((a, b) => {
					const idxA = daysOfWeek.findIndex(day => day.id === a.day);
					const idxB = daysOfWeek.findIndex(day => day.id === b.day);
					return idxA - idxB;
				});
				configData.schedule = updatedSchedule;
				setFormData(configData);
				dispatch(updateConfig(configData));
			} catch (error) {
				console.error('Error fetching config:', error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchConfig();
	}, [storeId, dispatch, user?.id]);

	useEffect(() => {
		if (storedConfig && !isSavingRef.current) {
			setFormData(storedConfig as ConfigFormData);
		}
	}, [storedConfig]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormData(prev => prev ? { ...prev, [name]: value } : prev);
	};

        const handleNestedChange = (
                field: keyof ConfigFormData,
                key: string,
                value: string | number | boolean | string[] | undefined
        ) => {
                setFormData(prevFormData => {
                        if (!prevFormData) return prevFormData;

                        if (field === 'activations') {
                                const updatedActivations = {
                                        ...(prevFormData.activations || {}),
                                        [key]: value as boolean,
                                };
                                return { ...prevFormData, activations: updatedActivations };
                        }

                        if (field === 'palette') {
                                const paletteValue = typeof value === 'string' ? value : String(value);
                                const updatedFormData = {
                                        ...prevFormData,
                                        palette: { ...(prevFormData.palette as object), [key]: paletteValue }
                                };
                                // Apply CSS property safely in the browser context
                                if (typeof window !== 'undefined') {
                                        document.documentElement.style.setProperty(key, paletteValue);
                                }
                                return updatedFormData;
                        }

                        return { ...prevFormData, [field]: { ...(prevFormData[field] as object), [key]: value } };
                });
        };	const uploadImage = async (file: File, path: string): Promise<string> => {
		const fileRef = storage.ref(`/stores/${storeId}/${path}/${file.name}-${Date.now()}`);
		await fileRef.put(file);
		return await fileRef.getDownloadURL();
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData) return;
		try {
			isSavingRef.current = true;
			setIsLoading(true);

			const dataToSend: Partial<ConfigFormData> = { ...formData };

			delete dataToSend._id;
			delete dataToSend.__v;
			delete dataToSend.createdAt;
			delete dataToSend.updatedAt;

			if (bannerFile.length > 0) {
				const newBanners = await Promise.all(
					bannerFile.map(file => uploadImage(file, 'banner'))
				);
				dataToSend.banners = [...(formData.banners || []), ...newBanners];
			}
			if (logoFile.length > 0) {
				dataToSend.logo = await uploadImage(logoFile[0], 'logo');
			}

			const response = await api.patch(`/config/${storeId}/my`, dataToSend);

			setFormData(response.data);
			dispatch(updateConfig(response.data));
			dispatch(addNotification({
				message: 'Configuración actualizada satisfactoriamente',
				color: 'success'
			}));
			setBannerFile([]);
		} catch (error) {
			console.error('Error al actualizar la configuración:', error);
			dispatch(addNotification({
				message: 'Error al actualizar la configuración',
				color: 'danger'
			}));
		} finally {
			setIsLoading(false);
			isSavingRef.current = false;
		}
	};

	const handleCoordinatesChange = (field: keyof Coordinates, value: number) => {
		setFormData(prev => {
			if (!prev) return prev;
			const currentCoordinates = prev.coordinates || { lat: 6.226885670017665, lng: -75.58341651733735 };
			return {
				...prev,
				coordinates: {
					...currentCoordinates,
					[field]: value,
				},
			};
		});
	};

	const handleFullCoordinatesChange = (coords: Coordinates) => {
		setFormData(prev => prev ? { ...prev, coordinates: coords } : prev);
	};

	const exportToJson = () => {
		if (!formData) return;

		const exportData: TransferableConfig = {
			about: formData.about,
			privacyPolicies: formData.privacyPolicies,
			palette: formData.palette,
			banners: formData.banners,
			paymentLink: formData.paymentLink,
			logo: formData.logo,
			showNavbarLogo: formData.showNavbarLogo,
			showNavbarTitle: formData.showNavbarTitle,
			navbarHeight: formData.navbarHeight,
			contactNumbers: formData.contactNumbers,
			socialNetworks: formData.socialNetworks,
			footer: formData.footer,
			legal: formData.legal,
			seo: formData.seo,
			customQuestions: formData.customQuestions,
			activations: formData.activations,
			schedule: formData.schedule,
			storeAddress: formData.storeAddress,
			coordinates: formData.coordinates,
			dominios: formData.dominios,
			customMessage: formData.customMessage,
			enablePaymentLinks: formData.enablePaymentLinks,
			plugins: formData.plugins,
			productViewConfig: formData.productViewConfig,
			productDetailConfig: formData.productDetailConfig,
		};

		const json = JSON.stringify(exportData, null, 2);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.setAttribute('download', 'configuracion.json');
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file || !formData) return;

		const reader = new FileReader();
		reader.onload = (evt) => {
			const data = evt.target?.result;
			if (!data) return;

			try {
				const importedData = JSON.parse(data as string) as TransferableConfig;

				const newConfig: ConfigFormData = {
					...formData,
					...importedData,
				};
				if (newConfig.enablePaymentLinks === undefined) {
					newConfig.enablePaymentLinks = false;
				}

				newConfig.id = formData.id;
				newConfig.store = formData.store;

				normalizeConfig(newConfig);

				setFormData(newConfig);
				dispatch(updateConfig(newConfig));
				dispatch(addNotification({
					message: 'Configuración importada. Por favor guarde los cambios para aplicarlos.',
					color: 'info'
				}));
			} catch (error) {
				console.error("Error al procesar JSON:", error);
				dispatch(addNotification({
					message: 'Error al importar la configuración',
					color: 'danger'
				}));
			}
		};
		reader.readAsText(file);
	};

	const normalizeConfig = (config: ConfigFormData) => {
		if (config.customQuestions) {
			config.customQuestions = config.customQuestions.map(q => {
				if (q.type === 'select' && !q.options) {
					return { ...q, options: [] };
				}
				return q;
			});
		} else {
			config.customQuestions = [];
		}

		if (!config.schedule) {
			config.schedule = [];
		}

		if (!config.dominios) {
			config.dominios = [];
		}
		if (!config.plugins) {
			config.plugins = { ...defaultPlugins };
		}
		if (config.enablePaymentLinks === undefined) {
			config.enablePaymentLinks = false;
		}
		if (config.showNavbarLogo === undefined) {
			config.showNavbarLogo = true;
		}
		if (config.showNavbarTitle === undefined) {
			config.showNavbarTitle = true;
		}
		const parsedNavbarHeight = typeof config.navbarHeight === 'number'
			? config.navbarHeight
			: Number.parseInt(String(config.navbarHeight), 10);
		config.navbarHeight = Number.isFinite(parsedNavbarHeight)
			? Math.min(Math.max(parsedNavbarHeight, 48), 200)
			: 60;

		const updatedSchedule = [...config.schedule];
		daysOfWeek.forEach(day => {
			if (!updatedSchedule.find(s => s.day === day.id)) {
				updatedSchedule.push({
					day: day.id,
					isOpen: true,
					openTime: '08:00',
					closeTime: '18:00',
				});
			}
		});

		updatedSchedule.sort((a, b) => {
			const idxA = daysOfWeek.findIndex(day => day.id === a.day);
			const idxB = daysOfWeek.findIndex(day => day.id === b.day);
			return idxA - idxB;
		});

		config.schedule = updatedSchedule;

		return config;
	};

	const handleUpdateBanners = (updatedBanners: string[]) => {
		setFormData(prev => prev ? { ...prev, banners: updatedBanners } : prev);
	};

	const handleDominiosChange = (dominios: string[]) => {
		setFormData(prev => prev ? { ...prev, dominios } : prev);
	};

	if (!isLoading && !isOwner) {
		return (
			<Container className="py-5">
				<Alert variant="danger">
					<Alert.Heading>Acceso Denegado</Alert.Heading>
					<p>
						No tienes permisos para acceder a la configuración de la tienda. Esta sección está disponible solo
						para propietarios de tiendas.
					</p>
				</Alert>
			</Container>
		);
	}

	if (isLoading || !formData) {
		return (
			<Container
				className="d-flex flex-column align-items-center justify-content-center"
				style={{
					position: 'fixed',
					top: 0,
					left: 200,
					right: 0,
					bottom: 0,
					zIndex: 9999,
				}}
			>
				<Spinner
					animation="border"
					variant="primary"
					style={{ width: '5rem', height: '5rem' }}
				/>
				<h4 className="mt-3">
					{isLoading && formData ? 'Guardando configuraciones...' : 'Cargando...'}
				</h4>
			</Container>
		);
	}

	return (
		<Container>
			<div className="d-flex justify-content-center align-items-center">
				<h1>Configuración de la Tienda</h1>
			</div>
			<Form onSubmit={handleSubmit}>
				<Row className="mb-3">
					<Col xs={12} lg={12} className="d-flex justify-content-between">
						<Button variant="secondary" onClick={exportToJson}>
							Exportar
						</Button>
						<Button
							variant="secondary"
							onClick={() => fileInputRef.current && fileInputRef.current.click()}
						>
							Importar
						</Button>
					</Col>
				</Row>
				<Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'encabezados')} id="config-tabs" className="mb-4 flex-wrap">
					<Tab eventKey="encabezados" title="Encabezados">
						<div className="pt-3">
							<h2>Encabezados</h2>
							<p>Añade tu logo y como quieres que te identifique tu tienda</p>
							<Row>
								<Col xs={12} lg={12} className="mb-3">
									<ImageConfigSection
										formData={formData}
										bannerFiles={bannerFile}
										setBannerFile={setBannerFile}
										setLogoFile={setLogoFile}
										onUpdateBanners={handleUpdateBanners}
										onConfigChange={(changes) => {
											setFormData(prev => prev ? { ...prev, ...changes } : prev);
										}}
									/>
								</Col>
							</Row>
						</div>
					</Tab>
					<Tab eventKey="pie" title="Pie de pagina">
						<div className="pt-3">
							<h2>Pie de pagina</h2>
							<p>Añade tus redes sociales y cualquier otro enlace para encontrar tu negocio asi como numeros de contacto</p>
							<Row>
								<Col xs={12} lg={12} className="mb-3">
									<FooterSection formData={formData} handleNestedChange={handleNestedChange} />
								</Col>
								<Col xs={12} lg={12} className="mb-3">
									<ContactSection formData={formData} setFormData={setFormData} />
								</Col>
								<Col xs={12} lg={6} className="mb-3">
									<ScheduleSection
										schedule={formData.schedule || []}
										setFormData={setFormData}
										formData={formData}
										daysOfWeek={daysOfWeek}
									/>
								</Col>
								<Col xs={12} lg={6} className="mb-3">
									<StoreAddressSection
										storeAddress={formData.storeAddress || ''}
										handleInputChange={handleInputChange}
									/>
								</Col>
							</Row>
						</div>
					</Tab>
					<Tab eventKey="paleta" title="Paleta">
						<div className="pt-3">
							<h2>Paleta de colores</h2>
							<p>Selecciona los colores de tu tienda puedes darle en vista previa para ver como va quedando, estos colores estan basados en la distribuccion Bootstrap</p>
							<Row>
								<Col xs={12} lg={12} className="mb-3">
									<ColorPaletteSection
										palette={formData.palette}
										handleNestedChange={(key, value) =>
											handleNestedChange('palette', key, value)
										}
									/>
								</Col>
							</Row>
						</div>
					</Tab>
					<Tab eventKey="nosotros" title="Nosotros">
						<div className="pt-3">
							<h2>Nosotros</h2>
							<p>Escribe un pequeño texto que hable sobre tu negocio, puedes agregarle emojis y links</p>
							<Row>
								<Col xs={12} lg={12} className="mb-3">
									<AboutSection
										about={formData.about || ''}
										handleInputChange={handleInputChange}
									/>
								</Col>
								<Col xs={12} lg={12} className="mb-3">
									<CoordinatesSection
										coordinates={formData.coordinates}
										handleCoordinatesChange={handleCoordinatesChange}
										handleFullCoordinatesChange={handleFullCoordinatesChange}
									/>
								</Col>
								<Col xs={12} lg={12} className="mb-3">
									<LegalSection formData={formData} handleNestedChange={handleNestedChange} />
								</Col>
							</Row>
						</div>
					</Tab>
					<Tab eventKey="pedido" title="Pedido">
						<div className="pt-3">
							<h2>Caracteristicas para el pedido</h2>
							<p>Selecciona las opciones que quieres que tus clientes puedan seleccionar al momento de hacer un pedido</p>
							<Row>
								<Col xs={12} lg={8} className="mb-3">
									<ActivationsSection
										activations={formData.activations || { requireLogin: false, requireUserData: false, deliveryEnabled: false }}
										handleNestedChange={(key, value) =>
											handleNestedChange('activations', key, value)
										}
										enablePaymentLinks={formData.enablePaymentLinks ?? false}
										onEnablePaymentLinksChange={(enabled) =>
											setFormData(prev => prev ? { ...prev, enablePaymentLinks: enabled } : prev)
										}
										customQuestionsCount={formData.customQuestions?.length ?? 0}
									/>
								</Col>
								<Col xs={12} lg={12} className="mb-3">
									<CustomMessageSection
										customMessage={formData.customMessage || ''}
										handleInputChange={handleInputChange}
									/>
								</Col>
								<Col xs={12} lg={12} className="mb-3">
									<fieldset className="mb-4">
										<legend>Preguntas previas al pedido</legend>
										<CustomQuestionForm
											questions={formData.customQuestions}
											onChange={updatedQuestions => {
												setFormData(prev => prev ? { ...prev, customQuestions: updatedQuestions } : prev);
											}}
										/>
									</fieldset>
								</Col>
							</Row>
						</div>
					</Tab>
					<Tab eventKey="seo" title="SEO">
						<div className="pt-3">
							<h2>SEO</h2>
							<p>Agrega los metadatos para que tu tienda sea indexada en los buscadores</p>
							<Row>
								<Col xs={12} lg={12} className="mb-3">
									<SeoSection formData={formData} handleNestedChange={handleNestedChange} />
								</Col>
							</Row>
						</div>
					</Tab>
					<Tab eventKey="servicios" title="Servicios">
						<div className="pt-3">
							<h2>Otros servicios</h2>
							<p>Esta seccion es solo para planes de pago y re quiere contactarse con Prizma para solicitar la configuracion del dominio</p>
							<Row>
								<Col xs={12} lg={12} className="mb-3">
									<DominiosSection dominios={formData?.dominios || []} onDominiosChange={handleDominiosChange} />
								</Col>
							</Row>
						</div>
					</Tab>
					<Tab eventKey="vistas" title="Vistas">
						<div className="pt-3">
							<h2>Configuración de Vistas</h2>
							<p>Configure cómo se muestran los productos en su tienda</p>
							<Row>
								<Col xs={12} lg={12} className="mb-3">
									<ProductViewConfigSection
										productViewConfig={formData.productViewConfig || {
											defaultView: 'carousel',
											filteredView: 'grid',
											availableViews: ['carousel', 'grid', 'clothing', 'list', 'featured', 'clothing-grid', 'wide-card', 'compact']
										}}
										handleNestedChange={handleNestedChange}
									/>
								</Col>
								<Col xs={12} lg={12} className="mb-3">
									<ProductDetailConfigSection
										productDetailConfig={formData.productDetailConfig || {
											viewType: ProductDetailViewType.MODAL,
											contentType: ProductContentType.PLAIN,
											showRecommendedProducts: true
										}}
										handleNestedChange={handleNestedChange}
									/>
								</Col>
							</Row>
						</div>
					</Tab>
					<Tab eventKey="integraciones" title="Integraciones">
						<div className="pt-3">
							<h2>Integraciones</h2>
							<p>Configura tus credenciales para SIGO (facturación electrónica). El Hub Central las gestiona automáticamente.</p>
							<Row>
								<Col xs={12} lg={12} className="mb-3">
									<IntegrationsSection />
								</Col>
							</Row>
						</div>
					</Tab>
				</Tabs>
				<div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000, display: 'flex', justifyContent: 'flex-end', width: 'auto' }}>
					<Button variant="primary" type="submit">Guardar cambios</Button>
				</div>
				<input
					type="file"
					accept=".json"
					ref={fileInputRef}
					style={{ display: 'none' }}
					onChange={handleImportJson}
				/>
			</Form>
		</Container>
	);
};

export default ConfigPage;
