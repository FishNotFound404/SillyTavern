import { Route } from 'react-router-dom'
import Groups from '../features/groups/pages/Groups'
import GroupEdit from '../features/groups/pages/GroupEdit'

export const groupRoutes = (
  <>
    <Route path="/groups" element={<Groups />} />
    <Route path="/groups/new" element={<GroupEdit />} />
  </>
)