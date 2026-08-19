import SidebarNavigation from './SidebarNavigation';
import CommandHeader from './CommandHeader';
import styles from './Layout.module.css';

const Layout = ({ children }) => {
  return (
    <div className={styles.appContainer}>
      <SidebarNavigation />
      <div className={styles.mainContent}>
        <CommandHeader />
        <main className={styles.pageContent}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
