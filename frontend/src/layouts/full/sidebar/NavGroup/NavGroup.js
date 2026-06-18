import PropTypes from 'prop-types';
// mui imports
import { ListSubheader, styled } from '@mui/material';

const NavGroup = ({ item }) => {
  const ListSubheaderStyle = styled((props) => <ListSubheader disableSticky {...props} />)(
    ({ theme }) => ({
      ...theme.typography.overline,
      fontWeight: '600',
      marginTop: theme.spacing(1.5),
      marginBottom: theme.spacing(1),
      color: '#6B7280',
      lineHeight: '20px',
      padding: '3px 16px',
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    }),
  );
  return (
    <ListSubheaderStyle>{item.subheader}</ListSubheaderStyle>
  );
};

NavGroup.propTypes = {
  item: PropTypes.object,
};

export default NavGroup;
