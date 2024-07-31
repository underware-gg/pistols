import { useDojoComponents } from '@/lib/dojo/DojoContext';
import { Component } from '@dojoengine/recs';
import React, { useMemo } from 'react'
import { Container, Divider } from 'semantic-ui-react';

export const AdminPanel = ({
  children = null,
  className=null,
}) => {
  const { Config, TableConfig, TableAdmittance } = useDojoComponents()
  return (
    <Container>
      Admin Panel
      <Divider />

      <AdminForm component={Config} />
      <Divider />
      
      <AdminForm component={TableConfig} />
      <Divider />
    </Container>
  );
}

const AdminForm = ({
  component,
}:{
  component: Component
}) => {
  const tag = useMemo<string>(() => (component.metadata.name as string), [component])
  const fields = useMemo(() => {
    return Object.keys(component.schema).map((key) => {
      return (
        <h5>{key}</h5>
      )
    })
  }, [component])
  console.log(component)
  return (
    <div>
      <h3>{tag}</h3>
      {fields}
    </div>
  )
}

