import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import {
  Button,
  Dropdown,
  Form,
  Grid,
  Menu,
  Modal,
  Popup,
  Tab,
  Table,
} from 'semantic-ui-react'

test('the Semantic UI primitive layer renders under React 19', () => {
  const panes = [{ menuItem: 'First tab', render: () => <div>Tab body</div> }]

  render(
    <>
      <Button>Action</Button>
      <Form><Form.Input label='Alias' /></Form>
      <Grid><Grid.Row><Grid.Column>Grid body</Grid.Column></Grid.Row></Grid>
      <Dropdown
        aria-label='Choice'
        defaultValue='one'
        options={[{ key: 'one', text: 'One', value: 'one' }]}
      />
      <Menu><Menu.Item>Menu item</Menu.Item></Menu>
      <Table><Table.Body><Table.Row><Table.Cell>Table body</Table.Cell></Table.Row></Table.Body></Table>
      <Tab panes={panes} />
      <Modal open><Modal.Content>Modal body</Modal.Content></Modal>
    </>,
  )

  expect(screen.getByText('Action')).toBeTruthy()
  expect(screen.getByText('Grid body')).toBeTruthy()
  expect(screen.getByText('Table body')).toBeTruthy()
  expect(screen.getByText('Tab body')).toBeTruthy()
  expect(screen.getByText('Modal body')).toBeTruthy()
})

test('Dropdown selection still dispatches under React 19', () => {
  const onChange = vi.fn()
  const { container } = render(
    <Dropdown
      selection
      placeholder='Choose'
      options={[{ key: 'one', text: 'One', value: 'one' }]}
      onChange={onChange}
    />,
  )

  fireEvent.click(container.querySelector('.ui.dropdown'))
  fireEvent.click(screen.getByRole('option', { name: 'One' }))
  expect(onChange).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ value: 'one' }))
})

test('Popup hover and dismissal still work under React 19', async () => {
  render(<Popup content='Hover body' trigger={<button>Hover trigger</button>} />)

  fireEvent.mouseEnter(screen.getByText('Hover trigger'))
  await waitFor(() => expect(screen.getByText('Hover body')).toBeTruthy())

  fireEvent.mouseLeave(screen.getByText('Hover trigger'))
  await waitFor(() => expect(screen.queryByText('Hover body')).toBeNull())
})

test('Modal portals and escape dismissal still work under React 19', () => {
  const onClose = vi.fn()
  render(<Modal open onClose={onClose}><Modal.Content>Dismiss me</Modal.Content></Modal>)

  expect(document.body.textContent).toContain('Dismiss me')
  fireEvent.keyDown(document, { key: 'Escape', keyCode: 27 })
  expect(onClose).toHaveBeenCalledOnce()
})
