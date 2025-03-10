<?php
/**
 * Plugin Name: AI Bundle Generator
 * Description: An example plugin to generate bundles of products using AI and Woo extension scaffold.
 * Version: 0.1.0
 * Author: Brian Coords
 * Author URI: https://www.briancoords.com
 * Text Domain: ai-bundle-generator
 * Domain Path: /languages
 * Requires Plugins: ai-services
 *
 * License: GNU General Public License v3.0
 * License URI: http://www.gnu.org/licenses/gpl-3.0.html
 *
 * @package extension
 */

defined( 'ABSPATH' ) || exit;

if ( ! defined( 'MAIN_PLUGIN_FILE' ) ) {
	define( 'MAIN_PLUGIN_FILE', __FILE__ );
}

require_once plugin_dir_path( __FILE__ ) . '/vendor/autoload_packages.php';

use MyExtensionName\Admin\Setup;

// phpcs:disable WordPress.Files.FileName

/**
 * WooCommerce fallback notice.
 *
 * @since 0.1.0
 */
function my_extension_name_missing_wc_notice() {
	/* translators: %s WC download URL link. */
	echo '<div class="error"><p><strong>' . sprintf( esc_html__( 'AI Bundle Generator requires WooCommerce to be installed and active. You can download %s here.', 'my_extension_name' ), '<a href="https://woo.com/" target="_blank">WooCommerce</a>' ) . '</strong></p></div>';
}

register_activation_hook( __FILE__, 'my_extension_name_activate' );

/**
 * Activation hook.
 *
 * @since 0.1.0
 */
function my_extension_name_activate() {
	if ( ! class_exists( 'WooCommerce' ) ) {
		add_action( 'admin_notices', 'my_extension_name_missing_wc_notice' );
		return;
	}
}

if ( ! class_exists( 'my_extension_name' ) ) :
	/**
	 * The my_extension_name class.
	 */
	class my_extension_name {
		/**
		 * This class instance.
		 *
		 * @var \my_extension_name single instance of this class.
		 */
		private static $instance;

		/**
		 * Constructor.
		 */
		public function __construct() {
			if ( is_admin() ) {
				new Setup();
			}
		}

		/**
		 * Cloning is forbidden.
		 */
		public function __clone() {
			wc_doing_it_wrong( __FUNCTION__, __( 'Cloning is forbidden.', 'my_extension_name' ), $this->version );
		}

		/**
		 * Unserializing instances of this class is forbidden.
		 */
		public function __wakeup() {
			wc_doing_it_wrong( __FUNCTION__, __( 'Unserializing instances of this class is forbidden.', 'my_extension_name' ), $this->version );
		}

		/**
		 * Gets the main instance.
		 *
		 * Ensures only one instance can be loaded.
		 *
		 * @return \my_extension_name
		 */
		public static function instance() {

			if ( null === self::$instance ) {
				self::$instance = new self();
			}

			return self::$instance;
		}
	}
endif;

add_action( 'plugins_loaded', 'my_extension_name_init', 10 );

/**
 * Initialize the plugin.
 *
 * @since 0.1.0
 */
function my_extension_name_init() {
	load_plugin_textdomain( 'my_extension_name', false, plugin_basename( dirname( __FILE__ ) ) . '/languages' );

	if ( ! class_exists( 'WooCommerce' ) ) {
		add_action( 'admin_notices', 'my_extension_name_missing_wc_notice' );
		return;
	}

	my_extension_name::instance();

}
